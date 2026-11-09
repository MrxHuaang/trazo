This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Sostén: project rules

- Product spec lives in `docs/` (documento maestro, v0.2). Read the relevant chapter before building a feature; user stories are `HU-xx`, business rules `RN-xx`.
- **Expo Go only**: the app must run in Expo Go on iPhone (no Mac, $0). Before adding any library with native code, confirm it ships in Expo Go; otherwise pick a JS-only alternative.
- **Testing target**: Pixel 8 Android emulator; destination is iPhone. Check the Pixel/iPhone differences table (chapter 10) for every screen: safe areas, keyboard, sheets, back gesture.
- **Design system "Trazo suave"**: every color, font, radius and spacing comes from `src/theme/tokens.ts`; no literal colors in components. Light mode only. One action color (cobalt `#2340E0`). Solidario always uses the durazno tile plus hatch texture. Icons: Phosphor via deep imports (`phosphor-react-native/src/icons/<Name>`), never the package root.
- **Structure**: routes in `src/app/` only compose; screens and pure rules live in `src/features/<feature>/`; reusable components in `src/ui/` (no business logic).
- Reanimated shared values: use `.get()` / `.set()` (React Compiler is enabled).
- Demo data only (`src/features/demo/`); never real patient data.
- UI copy in Spanish (Colombia); dates in `America/Bogota`.

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
