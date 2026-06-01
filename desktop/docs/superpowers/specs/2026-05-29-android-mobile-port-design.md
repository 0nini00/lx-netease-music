# Android Mobile Port Design

Date: 2026-05-29

## Goal

Create an Android-first mobile project named `lx-netease-music-mobile-port` beside the existing desktop project. The mobile app uses a clean, runnable architecture that supports staged migration of practical desktop features.

## Decisions Confirmed

- Platform: Android first. iOS is out of scope for now.
- New project location: `C:\Users\chenle\Desktop\OH-WorkSpace\lx-netease-music-mobile-port`
- Android package name: `cn.chenle.lx.netease.music.mobile`
- Architecture path: independent project first; consider extracting shared packages later.
- Tech stack: Vue 3, Vite, TypeScript, Capacitor, Vue Router, Pinia.
- UI strategy: custom lightweight mobile components, not a heavy UI framework initially.

## Context

The current desktop project is based on Electron, Vue 3, Webpack, and electron-builder. Key areas are:

- `src/main`: Electron main process, native desktop modules, IPC, filesystem and window logic.
- `src/renderer`: desktop UI, player, stores, music SDK, search, playlist, download and settings views.
- `src/renderer-lyric`: desktop lyric window.
- `src/common`: reusable types, utilities and theme-related code.

The mobile project must avoid directly copying Electron-specific structure. Desktop code should be reused only when it is browser/mobile-safe and independent from Node/Electron APIs.

## Architecture

The mobile app will use a layered structure:

```txt
src/
├── app/              # App bootstrap, router, global registration
├── pages/            # Route-level pages
├── components/       # Reusable UI components
├── stores/           # Pinia state modules
├── services/         # Business logic and API modules
├── native/           # Capacitor / Android capability wrappers
├── shared/           # Types, constants, utilities
└── styles/           # Global mobile styles and theme variables
```

Responsibilities:

- `pages`: presentation and page composition only.
- `stores`: app state such as player, queue, user, settings, downloads and sync status.
- `services`: business logic such as music APIs, NetEase features, gateway fallback, lyrics, downloads and storage.
- `native`: Android-specific capability wrappers such as audio focus, media notifications, filesystem permissions and future native plugins.
- `shared`: code that may later become a shared package between desktop and mobile.

## Initial Project Structure

```txt
lx-netease-music-mobile-port/
├── android/
├── public/
├── src/
│   ├── app/
│   │   ├── router.ts
│   │   └── bootstrap.ts
│   ├── assets/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppShell.vue
│   │   │   ├── AppTabBar.vue
│   │   │   └── MiniPlayer.vue
│   │   └── common/
│   │       ├── AppIcon.vue
│   │       ├── EmptyState.vue
│   │       └── LoadingView.vue
│   ├── pages/
│   │   ├── home/HomePage.vue
│   │   ├── search/SearchPage.vue
│   │   ├── mine/MinePage.vue
│   │   ├── download/DownloadPage.vue
│   │   ├── setting/SettingPage.vue
│   │   ├── playlist/PlaylistPage.vue
│   │   └── player/PlayerPage.vue
│   ├── stores/
│   │   ├── player.ts
│   │   ├── setting.ts
│   │   └── user.ts
│   ├── services/
│   │   ├── http/client.ts
│   │   ├── player/playerService.ts
│   │   ├── music/musicService.ts
│   │   ├── netease/neteaseService.ts
│   │   ├── gateway/gatewayService.ts
│   │   └── storage/storageService.ts
│   ├── native/
│   │   ├── audio/audioNative.ts
│   │   ├── notification/notificationNative.ts
│   │   └── permissions/permissionNative.ts
│   ├── shared/
│   │   ├── types/music.ts
│   │   ├── types/user.ts
│   │   ├── constants/routes.ts
│   │   └── utils/index.ts
│   ├── styles/
│   │   ├── variables.css
│   │   ├── base.css
│   │   └── mobile.css
│   ├── App.vue
│   └── main.ts
├── capacitor.config.ts
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Navigation and Pages

Mobile navigation will use bottom tabs instead of the desktop sidebar:

```txt
Bottom Tabs
├── Home
├── Search
├── Mine
├── Download
└── Setting
```

Additional pages:

- `playlist`: playlist detail page.
- `player`: full-screen player page.
- `account`: may be added later for NetEase login and account state.
- `sync`: may be added later for WebDAV and data sync.
- `import-export`: may be added later for list import/export flows.

The player UX will have two layers:

- Global mini player above the tab bar.
- Full-screen player opened by tapping the mini player.

## Migration Phases

### Phase 1: Foundation Skeleton

Scope:

- Vue 3 + Vite + TypeScript project.
- Capacitor Android project.
- Vue Router and Pinia.
- Base pages and tab navigation.
- Mini player shell.
- Full-screen player shell.
- Global mobile styles and theme variables.
- Service/store/native directory scaffolding.

Acceptance criteria:

- `npm install` succeeds.
- `npm run dev` succeeds.
- `npm run build` succeeds.
- `npx cap sync android` succeeds.
- `android/` project exists.
- Android package name is `cn.chenle.lx.netease.music.mobile`.
- The app can navigate between Home, Search, Mine, Download and Setting.
- The mini player opens the full-screen player page.

### Phase 2: Player Core

Scope:

- Player store.
- Playback queue.
- HTMLAudioElement wrapper.
- Play, pause, previous, next.
- Progress state.
- Playback modes: sequential, repeat-one, shuffle.
- Mini player and full-screen player state sync.
- Basic lyric display shell.

Acceptance criteria:

- Given a playable URL, the app can play it.
- Page navigation does not interrupt playback.
- Mini player and full-screen player show consistent state.

### Phase 3: NetEase and Music Sources

Scope:

- Search songs and playlists.
- Playlist detail loading.
- Song detail loading.
- Lyrics retrieval.
- NetEase account state.
- User-created and collected playlists.
- Gateway fallback.
- Multi-source polling.

Acceptance criteria:

- User can search and play songs.
- User can load NetEase account playlists.
- Gateway fallback works when primary source fails.

### Phase 4: Local Data and Downloads

Scope:

- Local favorite lists.
- Recent play history.
- Download task management.
- Download directory handling.
- Local music import.
- List import/export.

Acceptance criteria:

- Local lists persist across app restart.
- Download tasks can be created, paused, deleted and inspected.
- Android filesystem permissions are handled cleanly.

### Phase 5: Sync and Advanced Settings

Scope:

- WebDAV sync.
- Gateway editing and testing.
- Playback settings.
- Theme settings.
- Cache cleanup.
- Data backup and restore.

Acceptance criteria:

- WebDAV upload/download works.
- Settings persist.
- Gateway settings can be edited, tested and enabled.

### Phase 6: Android Native Experience

Scope:

- Background playback.
- Notification media controls.
- Lock-screen media controls.
- Headset button handling.
- Android audio focus.
- Battery optimization guidance.

Acceptance criteria:

- Playback continues with screen off.
- Notification controls can pause and skip tracks.
- Audio focus changes are handled correctly.

## Desktop Code Reuse Strategy

Prefer reuse:

- `src/common` types and utility logic when browser-safe.
- Music SDK logic that has no Node/Electron dependencies.
- Gateway fallback concepts and data structures.
- Some store data models.

Rewrite with reference:

- Player lifecycle.
- Download handling.
- Local list management.
- Settings UI.
- Page components.

Do not migrate directly:

- `src/main` Electron main process.
- IPC and window management.
- Tray and desktop menu logic.
- `src/renderer-lyric` desktop lyric window.
- Desktop-specific `better-sqlite3` storage approach.
- Desktop filesystem paths and process APIs.

Mobile replacements:

- Electron IPC becomes service calls and Capacitor/native wrappers.
- Desktop lyric window becomes full-screen lyrics, notification controls and possible future Android overlay.
- Desktop SQLite becomes IndexedDB/localForage/Preferences initially, with SQLite considered later if needed.

## Storage Plan

Initial storage:

- Pinia for runtime state.
- Capacitor Preferences for lightweight settings.
- IndexedDB/localForage-style storage for lists, history and metadata.
- Capacitor Filesystem later for downloaded music and import/export.

SQLite is intentionally deferred until local data complexity requires it.

## Networking Plan

Use a browser/mobile-safe request layer based on `fetch`, not Node-oriented `needle`.

Initial structure:

```txt
services/http/
├── client.ts
├── errors.ts
└── interceptors.ts
```

NetEase, gateway, lyrics and music-source modules will call this shared client.

## Staged Feature Scope

The mobile project is organized as a staged migration rather than a one-shot desktop clone. Core navigation, layout, store and service boundaries are established first; NetEase account flows, playback sources, downloads, WebDAV sync, notification controls, background playback and lyrics are added through the later phases above.

## Risks and Mitigations

- Risk: Directly copying desktop code brings Electron/Node dependencies into mobile.
  - Mitigation: migrate through `services`, `stores`, `native` and `shared` boundaries only.
- Risk: Android media controls and background playback are harder than web playback.
  - Mitigation: keep web playback and native media session integration separated behind the `native` boundary.
- Risk: Storage choice may become insufficient.
  - Mitigation: keep storage behind `storageService` so Preferences, IndexedDB or SQLite can be swapped without changing page code.
- Risk: Full feature parity creates too much scope.
  - Mitigation: use staged acceptance criteria and keep each phase runnable.

## Implementation Target

Maintain a runnable mobile baseline while features are migrated:

- Keep `lx-netease-music-mobile-port` as an independent Android-first project.
- Use Vue 3 + Vite + TypeScript with Capacitor Android package `cn.chenle.lx.netease.music.mobile`.
- Keep router, Pinia, pages, layout components, styles and service boundaries in place.
- Verify dev/build/Capacitor sync after each feature slice.
