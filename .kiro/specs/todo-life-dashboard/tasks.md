# Implementation Plan: To-Do List Life Dashboard

## Overview

Implement the dashboard as three files (`index.html`, `css/style.css`, `js/app.js`) using Vanilla JavaScript with no build tools or external libraries. Each task builds incrementally on the previous one, ending with all modules wired together into a fully functional single-page application.

---

## Tasks

- [x] 1. Scaffold project structure and HTML skeleton
  - Create `index.html` at the project root with correct `<!DOCTYPE html>`, `<html lang="en">`, `<head>`, and `<body>` sections
  - Add the FOUC-prevention inline `<script>` as the **first child of `<head>`** that reads `dashboard:theme` from `localStorage`, sets `data-theme` on `<html>`, computes the time-of-day period from `new Date()`, and sets `data-period` on `<html>`; falls back to `data-theme="light"` and the correct period on any error
  - Add `<link>` tags for Google Fonts (display font for clock/greeting, body font) and the single `<link rel="stylesheet" href="css/style.css">` stylesheet reference
  - Add the `<script src="js/app.js" defer>` tag
  - Create `css/style.css` (empty) and `js/app.js` (empty)
  - Add semantic landmark regions in `<body>`: `<header>` (greeting/clock), `<main>` with four `<section>` cards (timer, task list, quick links, settings/name), and `<footer>`
  - _Requirements: 12.1, 12.2, 12.3, 10.4_

- [x] 2. Implement StorageService
  - [x] 2.1 Write `StorageService` IIFE in `js/app.js`
    - Implement `save(key, value)`: `JSON.stringify` then `localStorage.setItem`; rethrow quota errors so callers can handle them
    - Implement `load(key, fallback)`: `getItem` → `JSON.parse`; return `fallback` on any error (null key, parse failure, unavailable storage)
    - Implement `remove(key)`: `localStorage.removeItem`; silent on error
    - _Requirements: 6.11, 6.12, 6.13, 9.6, 9.7, 9.8, 9.9_

  - [ ]* 2.2 Write unit tests for StorageService (manual browser console verification)
    - Test `load` returns fallback when key absent
    - Test `load` returns fallback when stored value is malformed JSON
    - Test `save` → `load` round-trip preserves objects and arrays
    - _Requirements: 6.13, 9.8_

- [x] 3. Implement ThemeManager and CSS custom-property skeleton
  - [x] 3.1 Write `ThemeManager` IIFE in `js/app.js`
    - Implement `init()`: read `dashboard:theme` from `StorageService.load`; apply `data-theme` and `data-period` to `document.documentElement`; persist theme back; wire toggle button click handler
    - Implement `toggle()`: flip `data-theme` between `light` and `dark`; call `StorageService.save('dashboard:theme', ...)`; update toggle button icon/label
    - Implement `applyPeriod(period)`: set `data-period` attribute; used by `ClockModule` on period-boundary crossing
    - Implement `getCurrentTheme()`: return current `data-theme` attribute value
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_

  - [x] 3.2 Add CSS custom properties and attribute-selector rulesets to `css/style.css`
    - Define CSS variables (`--accent`, `--bg`, `--surface`, `--text`, `--text-muted`, `--border-radius-card`) under each `[data-theme][data-period]` combination (4 periods × 2 themes = 8 rulesets)
    - Morning light: amber/soft-orange accents; morning dark: darker amber tones
    - Afternoon light: sky-blue/teal accents; afternoon dark: deeper teal tones
    - Evening light: muted-purple/rose accents; evening dark: deeper purple tones
    - Night light: deep-navy accents on light base; night dark: deep-navy/midnight tones
    - Add base reset, `body` font, and card layout rules (padding ≥ 16px, border-radius ≥ 8px per card)
    - Add theme-toggle button styles with `transition ≤ 300ms`
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 13.3, 13.6, 10.2_

  - [ ]* 3.3 Write property test for time-period mapping (manual)
    - **Property 3: Time-period mapping is total and exhaustive**
    - Manually verify in browser console: loop hours 0–23, call `ClockModule._getPeriod(h)`, assert each hour maps to exactly one valid period string
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 11.1, 11.2, 11.3, 11.4**

- [x] 4. Implement ClockModule
  - [x] 4.1 Write `ClockModule` IIFE in `js/app.js`
    - Implement `_formatTime(d)`: pure function; return `"HH:MM:SS"` with zero-padded components; on `Date` read error return `"--:--:--"`
    - Implement `_formatDate(d)`: pure function; return `"Weekday, DD Month YYYY"` using `toLocaleDateString` or manual arrays; on error return `"Date unavailable"`
    - Implement `_getPeriod(hour)`: pure function; map 5–11 → `'morning'`, 12–17 → `'afternoon'`, 18–20 → `'evening'`, 0–4 and 21–23 → `'night'`
    - Implement `_getGreeting(hour)`: pure function; map 5–11 → `'Good Morning'`, 12–17 → `'Good Afternoon'`, else → `'Good Evening'`
    - Implement `_tick()`: get `new Date()` in try/catch; call pure formatters; update time and date DOM elements; detect period changes and call `ThemeManager.applyPeriod(period)` and `GreetingModule.updateGreeting(hour)` when period or hour changes
    - Implement `init()`: call `_tick()` immediately, then `setInterval(_tick, 1000)`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 11.5, 11.6_

  - [ ]* 4.2 Write property tests for clock formatting (manual)
    - **Property 1: Clock time formatting zero-pads all components**
    - Verify `_formatTime` for midnight (00:00:00), 9:05:03, 23:59:59 — assert all return exactly `"HH:MM:SS"` with two-digit components
    - **Validates: Requirements 1.1**
    - **Property 2: Clock date formatting contains all required components**
    - Verify `_formatDate` returns a string containing a weekday name, numeric day, month name, and four-digit year
    - **Validates: Requirements 1.2**

- [x] 5. Implement GreetingModule
  - [x] 5.1 Write `GreetingModule` IIFE in `js/app.js`
    - Implement `_composeSalutation(greeting, name)`: pure function; if name is non-empty after trim return `"${greeting}, ${name.slice(0, 50)}"`; else return `greeting`
    - Implement `init()`: load `dashboard:username` via `StorageService.load`; populate name input field; call `updateGreeting` with current hour from `ClockModule`
    - Implement `saveName(rawInput)`: trim input; if empty/whitespace show inline validation message (`<span role="alert">`) and return `{ok: false, error: "..."}` without writing storage; else persist via `StorageService.save('dashboard:username', trimmed)`; update greeting DOM; return `{ok: true}`
    - Implement `updateGreeting(hour)`: recompose salutation using stored name and current greeting; update heading DOM
    - Wire save button click to `saveName`; clear validation message on next valid attempt
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ]* 5.2 Write property test for salutation composition (manual)
    - **Property 4: Greeting salutation composition with name**
    - Test: `_composeSalutation("Good Morning", "")` → `"Good Morning"`; `_composeSalutation("Good Morning", "  ")` → `"Good Morning"`; `_composeSalutation("Good Morning", "Sabrina")` → `"Good Morning, Sabrina"`; name > 50 chars → truncated to 50
    - **Validates: Requirements 2.5, 2.6, 2.7**

- [x] 6. Implement TimerModule
  - [x] 6.1 Write `TimerModule` IIFE in `js/app.js`
    - Implement `_formatTimer(secs)`: pure function; return `"MM:SS"` with zero-padded minutes and seconds; support up to 7200 seconds (120 minutes)
    - Implement `init()`: load `dashboard:pomodoro-duration` from storage (default 25); store remaining seconds; render display; call `_updateButtons('paused')`
    - Implement `start()`: guard — if remaining ≤ 0 do nothing; set `setInterval(_tick, 1000)`; call `_updateButtons('running')`
    - Implement `stop()`: clear interval; call `_updateButtons('paused')`
    - Implement `reset()`: clear interval; restore remaining to full duration; update display within 200ms; call `_updateButtons('paused')`
    - Implement `_tick()`: decrement remaining; update display; if remaining reaches 0, clear interval, call `_updateButtons('complete')`, call `_notify()`
    - Implement `_updateButtons(state)`: `'running'` → disable Start, enable Stop; `'paused'` → enable Start, disable Stop; `'complete'` → disable both
    - Implement `_notify()`: show visible notification element for ≥ 3 seconds; if `AudioContext` available, emit a beep ≥ 1 second using Web Audio API oscillator; silently skip audio on API unavailability
    - Implement `setDuration(minutes)`: validate integer in [1, 120]; if invalid show `<span role="alert">` validation message; if valid, persist to storage, update stored duration; if no session running/paused apply to display immediately; return `{ok, error}`
    - Wire Start/Stop/Reset buttons and duration save button
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 4.10, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

  - [ ]* 6.2 Write property test for timer formatting (manual)
    - **Property 8: Timer formatting round-trips seconds to MM:SS**
    - Test boundary values: 0 → `"00:00"`, 60 → `"01:00"`, 1500 → `"25:00"`, 7200 → `"120:00"`; verify `parseInt(MM)*60 + parseInt(SS) === input`
    - **Validates: Requirements 4.1, 4.5**

- [x] 7. Checkpoint — verify clock, greeting, and timer
  - Ensure all tests pass, ask the user if questions arise.
  - Open `index.html` in a browser; confirm clock ticks every second, greeting shows correct salutation for current hour, name saves and restores on reload, timer starts/stops/resets correctly, duration persists, and `data-theme`/`data-period` are set on `<html>` before paint.

- [x] 8. Implement TaskModule
  - [ ] 8.1 Write pure helper functions for TaskModule in `js/app.js`
    - Implement `_validate(description)`: if empty/whitespace return `{ok: false, error: "required"}`; if trimmed length > 200 return `{ok: false, error: "max200"}`; else return `{ok: true}`
    - Implement `_isDuplicate(desc, tasks, excludeId)`: trim + lowercase `desc`; compare against each task's trimmed + lowercased description where `task.id !== excludeId`; return `true` if any match found
    - Implement `_sortTasks(tasks, order)`: return a **new array** (never mutate input); `'default'` → sort by `insertionIndex` ascending; `'status'` → incomplete first, each group stable by `insertionIndex`; `'alphabetical'` → `localeCompare` case-insensitive, ties broken by `insertionIndex`
    - _Requirements: 6.2, 6.3, 6.4, 6.7, 6.8, 7.1, 7.2, 7.3, 7.4, 8.2, 8.3, 8.4, 8.5_

  - [ ]* 8.2 Write property tests for TaskModule pure functions (manual)
    - **Property 5: Task description validation rejects empty and over-length inputs**
    - Test: empty string → `{ok: false}`; `"  "` → `{ok: false}`; 201-char string → `{ok: false}`; 1-char string → `{ok: true}`; 200-char string → `{ok: true}`
    - **Validates: Requirements 6.2, 6.3, 6.4, 6.7, 6.8**
    - **Property 6: Duplicate detection is case-insensitive and trim-invariant**
    - Test: `_isDuplicate("BUY MILK", [{id:"1", description:"buy milk"}], null)` → `true`; `_isDuplicate("buy milk", [...], "1")` with `excludeId="1"` → `false`; `_isDuplicate("  Buy Milk  ", ...)` → `true`
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.4**
    - **Property 7: Sort order produces stable, non-destructive output**
    - Test: `_sortTasks(tasks, 'default')` does not mutate input array; result contains same IDs; status sort puts all incomplete first; alphabetical sort is case-insensitive
    - **Validates: Requirements 8.2, 8.3, 8.4, 8.5**

  - [ ] 8.3 Write `TaskModule` DOM methods in `js/app.js`
    - Implement `init()`: load `dashboard:tasks` from `StorageService.load` (fallback `[]`); if parse fails render empty list with non-blocking error banner; call `_render()`
    - Implement `addTask(description)`: call `_validate`; if invalid show `<span role="alert">`; call `_isDuplicate`; if duplicate show `<span role="alert">`; else push new task object `{id: Date.now().toString(), description: trimmed, completed: false, insertionIndex: nextIndex}`; call `StorageService.save`; call `_render()` within 300ms
    - Implement `editTask(id, newDescription)`: run all three validations (empty, length, duplicate excluding self); on any failure show `<span role="alert">` in edit field; on success update task object and call `StorageService.save`; call `_render()`
    - Implement `toggleTask(id)`: flip `completed`; call `StorageService.save` within 500ms; call `_render()`
    - Implement `deleteTask(id)`: filter out task by id; call `StorageService.save` within 500ms; call `_render()`
    - Implement `setSortOrder(order)`: store active order; call `_render()`; re-apply within 300ms of any subsequent add
    - Implement `_render()`: apply `_sortTasks`; for each task render a list item with: checkbox (completion toggle), description span (with strikethrough + reduced-opacity style when `completed: true`), edit button, delete button; activate edit mode inline when edit button clicked; wire all event handlers
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9, 6.10, 6.11, 6.12, 6.13, 7.1, 7.2, 7.3, 7.4, 8.1, 8.6, 13.5_

  - [ ]* 8.4 Write property test for task addition (manual)
    - **Property 10: Task addition grows the list and stores the task**
    - Before add: record task count; call `addTask("Buy milk")`; assert task count increased by 1; assert `StorageService.load('dashboard:tasks')` contains a task with `description === "Buy milk"`
    - **Validates: Requirements 6.2, 6.11**

- [ ] 9. Implement QuickLinksModule
  - [ ] 9.1 Write `QuickLinksModule` IIFE in `js/app.js`
    - Implement `_validateLabel(label)`: return `{ok: false}` if empty/whitespace or trimmed length > 50; else `{ok: true}`
    - Implement `_validateUrl(url)`: return `true` if non-empty string starting with `"http://"` or `"https://"`; else `false`
    - Implement `init()`: load `dashboard:links` from `StorageService.load` (fallback `[]`); if parse fails render empty list with non-blocking error banner; call `_render()` within 500ms
    - Implement `addLink(label, url)`: validate both fields; on any failure show `<span role="alert">` adjacent to the failing field; on success push `{id: Date.now().toString(), label: trimmed, url: trimmed}`; call `StorageService.save`; if save fails keep item in UI but show non-blocking warning; call `_render()` within 300ms
    - Implement `deleteLink(id)`: filter out link; call `StorageService.save`; call `_render()` within 300ms
    - Implement `_render()`: for each link render a `<button>` that opens `link.url` in a new tab (`window.open(url, '_blank')`), plus a delete control; wire all event handlers
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8, 9.9_

  - [ ]* 9.2 Write property test for URL validation (manual)
    - **Property 9: URL validation accepts only http/https and rejects others**
    - Test: `""` → `false`; `"ftp://x.com"` → `false`; `"//x.com"` → `false`; `"http://x.com"` → `true`; `"https://x.com"` → `true`; relative path `"x.com"` → `false`
    - **Validates: Requirements 9.2, 9.4**

- [ ] 10. Add typography, card layout, and micro-interaction CSS
  - Add Google Fonts `<link>` tags in `index.html` `<head>` for the display font (clock/greeting) and body font
  - In `css/style.css`:
    - Apply display font to clock time, clock date, and greeting heading elements; apply body font (min 14px) to all other text
    - Apply card styles to each `<section>`: `padding ≥ 16px`, `border-radius ≥ 8px`, `background: var(--surface)`, `border: 1px solid var(--border)`
    - Add `transition: background-color 200ms, color 200ms, box-shadow 200ms` to interactive buttons; add `:hover` rules for background-color shift or box-shadow within 100ms (use `transition-duration: 100ms` on hover via CSS)
    - Add completed-task visual treatment: `text-decoration: line-through`, `opacity: 0.5`
    - Add theme-transition rule on `html`: `transition: background-color 300ms, color 300ms` (≤ 300ms)
    - Add responsive layout so all four cards stack or grid sensibly on mobile and desktop
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6_

- [ ] 11. Wire all modules together in the DOMContentLoaded bootstrap
  - In `js/app.js`, add a `DOMContentLoaded` listener at the bottom that calls `init()` on each module in dependency order:
    1. `StorageService` (no init needed, it is ready on definition)
    2. `ThemeManager.init()`
    3. `ClockModule.init()`
    4. `GreetingModule.init()`
    5. `TimerModule.init()`
    6. `TaskModule.init()`
    7. `QuickLinksModule.init()`
  - Verify `ClockModule._tick()` calls `ThemeManager.applyPeriod()` and `GreetingModule.updateGreeting()` on load and on period-boundary changes
  - Verify sort control wires to `TaskModule.setSortOrder()`
  - Verify theme toggle button wires to `ThemeManager.toggle()`
  - _Requirements: 1.3, 2.7, 11.5, 11.6, 12.6_

- [ ] 12. Final checkpoint — cross-browser verification
  - Ensure all tests pass, ask the user if questions arise.
  - Open `index.html` directly from the filesystem (no server) in Chrome, Firefox, Edge, and Safari; verify:
    - No JavaScript errors in the console
    - Theme and period are set before first paint (no flash)
    - All CRUD operations on tasks and links persist across page reload
    - Timer countdown, stop, reset, and completion notification all work correctly
    - Sort control re-orders the task list without affecting persisted order
    - Hover states are visible and transitions are ≤ 300ms
    - Layout is readable at both mobile (≤ 375px) and desktop (≥ 1024px) widths

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP build; all manual test tasks fall in this category since there is no automated test framework
- Each task references specific requirements for traceability
- Checkpoints at tasks 7 and 12 ensure incremental validation
- Property tests (Properties 1–10 from the design) are all manual browser-console verifications because the project uses no test framework
- The FOUC-prevention inline script in task 1 must remain the first element in `<head>` — moving it will break theme-before-paint behavior
- `StorageService` must be defined before all other modules in `app.js` since they depend on it at call time

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["2.1"] },
    { "id": 1, "tasks": ["3.1", "3.2", "2.2"] },
    { "id": 2, "tasks": ["4.1", "3.3"] },
    { "id": 3, "tasks": ["5.1", "4.2"] },
    { "id": 4, "tasks": ["6.1", "5.2"] },
    { "id": 5, "tasks": ["8.1", "6.2"] },
    { "id": 6, "tasks": ["8.2", "8.3"] },
    { "id": 7, "tasks": ["9.1", "8.4"] },
    { "id": 8, "tasks": ["9.2"] }
  ]
}
```
