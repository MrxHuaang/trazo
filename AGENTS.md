This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Trazo: project rules

- Product spec lives in `docs/` (documento maestro, v0.2). Read the relevant chapter before building a feature; user stories are `HU-xx`, business rules `RN-xx`.
- **Expo Go only**: the app must run in Expo Go on iPhone (no Mac, $0). Before adding any library with native code, confirm it ships in Expo Go; otherwise pick a JS-only alternative.
- **Testing target**: Pixel 8 Android emulator; destination is iPhone. Check the Pixel/iPhone differences table (chapter 10) for every screen: safe areas, keyboard, sheets, back gesture.
- **Design system "Trazo suave"** styled with **NativeWind 4 + Tailwind 3** (the course stack): use `className` everywhere. Colors, fonts, radii and the type scale live in `tailwind.config.js` (source of truth for colors: `src/theme/palette.js`). `src/theme/tokens.ts` only feeds SVG, Reanimated and native APIs. No `StyleSheet.create` and no literal colors in screens; inline `style` only for dynamic values (measured sizes, animated styles, safe-area insets). Light mode only. One action color (cobalt `accent`). Solidario always uses the `durazno` tile plus hatch texture. Icons: Phosphor via deep imports (`phosphor-react-native/src/icons/<Name>`), never the package root.
- **Course alignment (90 % of the stack must be what was taught)**: Expo Router (tabs, stack, dynamic routes), NativeWind/Tailwind, TanStack Query + axios for remote data, Zustand for UI state, expo-location + Leaflet in a WebView for maps, react-native-reanimated-carousel, Reanimated + Gesture Handler. Extras (SQLite, sensors, biometrics, notifications, PDF) are the remaining 10 %.
- **Structure**: routes in `src/app/` only compose; screens and pure rules live in `src/features/<feature>/`; reusable components in `src/ui/` (no business logic).
- Reanimated shared values: use `.get()` / `.set()` (React Compiler is enabled).
- Demo data only (`src/data/seed.ts`); never real patient data.
- UI copy in Spanish (Colombia); dates in `America/Bogota`.

## Data layer (local-first)

- Persistence is **local SQLite** (`expo-sqlite`, ships in Expo Go). Schema: `src/data/schema.ts` (append-only migrations, `PRAGMA user_version`). Helpers: `src/data/db.ts` (`consultar`, `consultarUno`, `ejecutar`, `bool`, `bit`, `ahoraIso`).
- Domain types and enums: `src/domain/types.ts`. Shared repositories: `src/data/repos/` (consultorio, pacientes, citas, pagos, seguimientos). Shared TanStack Query hooks: `src/data/hooks.ts`. Base query keys: `src/data/keys.ts` (`qk`): every query key starts with one of them; mutations invalidate by base key.
- Feature-specific tables (notas, consentimientos, disponibilidad, bloqueos, jornadas, asistentes, recursos) get their repository and hooks **inside the owning feature** (`src/features/<feature>/repo.ts`, `hooks.ts`), using the helpers above.
- Dates: always use `src/lib/dates.ts` (`isoDesde`, `fechaClave`, `horaTexto`, `fechaCorta`, `inicioSemana`, …). Money: `src/lib/format.ts`. WhatsApp: `src/lib/whatsapp.ts`. IDs: `src/lib/id.ts`.
- Demo data: `src/data/seed.ts` (`cargarDemo()`), fictitious only.
- Supabase is a future adapter (ADR-010). Remote data (public APIs only, never patient data) goes through axios + TanStack Query in `src/features/<feature>/api.ts`, as taught in the course.

## UI building blocks

`src/ui`: Text (`variant`, `className`), Button, Field, Segmented, ToggleRow, Sheet + SheetHeader (for `formSheet` routes), Tile (`tone`, `className`, `contentClassName`), TraceLine (`nodes`, `energia` shared value for live motion), HatchOverlay, SolidarioMark, ListRow, Chip, Fab, EmptyState, Screen, plus motion pieces: **Presionable** (press spring + haptic; base of every tappable), **Aparecer** (staggered entrance, `orden`), **NumeroAnimado** (counting number). Merge classes with `cn()` from `src/lib/cn.ts`. Sheet routes declare `<Stack.Screen options={{ presentation: 'formSheet', sheetAllowedDetents: [0.85, 1], sheetGrabberVisible: false }} />` in the route file. New components that only one feature needs live in that feature folder, not in `src/ui`.

### NativeWind rules that bite

- **Never pass a function to `style` on `Pressable`** (`style={({ pressed }) => ...}`): NativeWind drops it and the layout breaks. Use `className` with `active:opacity-60`, or `Presionable`.
- Tailwind class names must be complete string literals (`cond ? 'bg-menta' : 'bg-lavanda'`), never built by concatenation (`'bg-' + tono`).
- Type sizes: `text-display | number | title | heading | body-lg | body | label | caption`; fonts: `font-display | display-bold | body | medium | semibold | mono`. Prefer `<Text variant>` over raw classes.
- Dashed borders: `border border-dashed`; touch targets at least `min-h-[44px]`.

## Design v2 "Trazo vivo": motion and feel

The interface should feel alive but calm (the audience includes people affected by an earthquake): every animation must mean something. No decoration loops, no bouncing for its own sake, everything honors Reduce Motion.

- **Entrance**: each screen's top-level blocks enter once with `<Aparecer orden={i}>` (cascade). Lists that lose or reorder rows use `reacomodar`.
- **Touch**: every tappable uses `Presionable` or a `src/ui` component built on it. Haptics: light selection on taps, `Haptics.notificationAsync(Success)` only when something is saved or completed.
- **Numbers**: counts and money shown in tiles use `NumeroAnimado`.
- **The Trazo is the signature**: use `TraceLine` as loader, in empty states, and as the live element of a screen (day line with nodes, history spine). The next appointment node pulses; nothing else loops.
- **Gestures over buttons** where it is natural: swipe a row to act, drag to move, pull to refresh. Always keep a visible button alternative (accessibility).
- **Feedback on save**: close the sheet, success haptic, and the changed item animates into place (layout transition); no toasts saying "guardado exitosamente".
- Typography does the heavy lifting: big `font-display` numbers inside tiles, `font-mono` for hours and money in lists. Tiles are flat color, radius `rounded-tile`, no shadows (only the Fab has one).
- Copy: Spanish (Colombia), concrete, warm, no em dashes, no "por favor", no emojis.

## Module ownership (parallel work)

| Module | Owns routes | Feature folder |
|---|---|---|
| agenda | `(tabs)/agenda`, `cita/nueva`, `cita/[id]`, `ajustes/disponibilidad` | `src/features/agenda` |
| pacientes | `(tabs)/pacientes`, `paciente/nuevo`, `paciente/[id]`, `nota/[id]` | `src/features/pacientes` |
| hoy | `(tabs)/index`, `por-confirmar`, `pagos`, `ajustes/plantillas`, `resumen` | `src/features/hoy`, `src/features/pagos` |
| solidario | `(tabs)/solidario`, `jornada/nueva`, `jornada/[id]`, `seguimientos`, `informe`, `ajustes/cupos`, `mapa` | `src/features/solidario` |
| acceso | `onboarding`, `ajustes/index`, `calma`, `AccessGate` | `src/features/acceso`, `src/features/calma` |

Edit only your module's routes and folder. Shared files (`src/data/*`, `src/domain/*`, `src/lib/*`, `src/ui/*`, `src/theme/*`, `src/app/_layout.tsx`, `package.json`) are read-only for modules; if you truly need a change there, keep it minimal and additive and say so in your report.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint and typecheck before declaring any task done.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md
