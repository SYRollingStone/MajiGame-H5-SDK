# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project context

H5 game SDK for [majigame.com](https://majigame.com), modeled after Poki / CrazyGames. Currently at v0.1.0 (phase 1: security module only). The canonical development plan is [需求顺序.md](需求顺序.md) — **always read/update this file when planning new phases or making scope decisions**. The phase table at the top tracks status; the "决策记录" table at the bottom records why architectural calls were made.

The user is building this for a Cloudflare Pages-hosted game site. No backend exists yet — phase 5 plans a separate `majigame-backend` repo running Cloudflare Workers + Analytics Engine. Don't add backend code to this SDK repo.

## Commands

```bash
npm run build       # Vite lib build → dist/maji-sdk.min.js (UMD) + maji-sdk.js (ESM) + .d.ts
npm run build:nomin # Same but skips obfuscation (for debugging the build output)
npm run type-check  # tsc --noEmit
npm run serve       # http-server on :5173 serving the repo root
```

There is no test suite. Verification is manual via the two HTML pages served by `npm run serve`:
- `http://localhost:5173/examples/security-demo.html` — SDK-internal self-test
- `http://localhost:5173/test-consumer/index.html` — simulates a third-party game integrating via `<script src>`

The test-consumer page is the **full-chain validation**: build → CDN-style script include → API call → feature works. Don't treat it as an example; treat it as the integration test.

## Architecture

### Module layout
```
src/
  core/             config normalization, event bus, debug logger
  modules/security/ phase 1 — anti-debug, shortcuts, domain-lock
  types.ts          all public types (split between user-facing `*Options` and internal `Resolved*Options`)
  index.ts          UMD entry, exports MajiSDK global
```

### Config normalization pattern (`core/config.ts`)
Every security submodule's config accepts **three input shapes**: `true` (use defaults), `false` (disable), or partial object (merge with defaults). The `normalize()` helper handles all three and returns a fully-resolved object with `enabled: boolean`. When adding new modules, follow this pattern — don't introduce new shapes.

### Anti-debug: manager + 5 detectors + overlay
The flow is a polling loop (`AntiDebugManager.tick()`, every 1500ms default) that runs all enabled detectors. Each detector is independent and returns `boolean`. On first hit it transitions to "detected" state, applies the configured action, fires `onDetect` callback. When all detectors return false again and `autoRecover: true`, it transitions back and fires `onRecover`.

**Default action is `freeze+tip` (4399-style)** — this was an explicit user requirement. It starts a 50ms-interval `debugger` trap loop (kills DevTools usability) plus shows a full-screen overlay, and auto-removes both when detection clears. Don't change this default without confirmation.

The 5 detectors have very different reliability profiles — preserve these comments if rewriting:
- `debugger` / `timing`: use `new Function('debugger')` (CSP-safe; bundlers won't strip the `debugger` keyword inside `new Function`)
- `console`: getter-trick. Works in Chrome but not all browsers/versions.
- `size`: detects docked DevTools only. Undocked windows produce false negatives.
- `toString`: detects anti-anti-debug hooks. Once triggered, **the toString hook persists**, so auto-recovery won't restore — keep this in mind.

### The `TRAP` constant
Both `detectors.ts` and `manager.ts` independently define `TRAP = new Function('debugger')` with a try/catch fallback for CSP environments. This is intentional duplication — keep them independent so neither file's failure breaks the other. Don't refactor to a shared module.

### Build pipeline gotchas
- `rollup-plugin-obfuscator` is CJS. `vite.config.ts` uses `obfuscatorPkg.default ?? obfuscatorPkg` for interop — don't simplify to a named import, it breaks.
- `output.exports: 'named'` in `rollupOptions.output` is **required**. Without it, UMD consumers must call `MajiSDK.default.init()` instead of `MajiSDK.init()`.
- Obfuscation only runs in default mode (`vite build`), skipped in `--mode nomin`. If debugging output, use `build:nomin` first.

### Public API surface (`src/index.ts`)
Both named exports and a `default` export object are provided. UMD consumers access named exports directly on the `MajiSDK` global. The bundle exposes: `VERSION`, `init`, `destroy`, `isReady`, `isDetected`, `on`, `off`. **`init` is single-shot** — second calls are logged and ignored. Call `destroy()` first if you need to re-init with new config.

## Conventions

- **TypeScript strict mode** is on. The `Resolved*Options` types use `Required<*Options>` to encode "all defaults filled in." Keep this separation — public types stay partial, internal types are fully resolved.
- **Comments**: existing code has near-zero comments by design. Don't add explanatory comments for what code already says. Comments only for non-obvious *why* (e.g. CSP fallbacks, browser quirks).
- **No emoji** in code or files unless the user explicitly asks.
- **Chinese-language UI strings and docs** are the norm (user is Chinese-speaking). Keep tip text, README, and 需求顺序.md in Chinese. Code identifiers stay in English.

## When extending the SDK

Before adding a new module, check 需求顺序.md to see which phase it belongs to and whether prerequisites are done. New modules go under `src/modules/<name>/` and follow the same shape as `security/`: an `index.ts` that exports a `start*()` function returning a handle with `stop()`. Wire it into `src/index.ts` `init()` and add resolved config to `ResolvedOptions` in `types.ts`.

For phase 4 (analytics), the user explicitly wants a `transport` abstraction with `noop` / `console` / `cloudflare` / `posthog` adapters — the first version should ship with just `noop` and `console`, so the API is stable before any backend exists.
