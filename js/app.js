// js/app.js — populated incrementally starting from task 2

// ─── StorageService ───────────────────────────────────────────────────────────
// Wraps localStorage with JSON serialisation and graceful error handling.
// All other modules depend on this, so it must be defined first.
// Requirements: 6.11, 6.12, 6.13, 9.6, 9.7, 9.8, 9.9
var StorageService = (function () {
  'use strict';

  /**
   * Serialise `value` as JSON and write it to localStorage under `key`.
   * QuotaExceededError is re-thrown so callers can surface a warning to the
   * user (Requirement 9.9). All other errors are silently swallowed.
   *
   * @param {string} key
   * @param {*} value
   */
  function save(key, value) {
    try {
      var serialised = JSON.stringify(value);
      localStorage.setItem(key, serialised);
    } catch (err) {
      // Re-throw storage-quota errors so callers can warn the user.
      if (
        err instanceof DOMException &&
        (err.name === 'QuotaExceededError' ||
          err.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
          err.code === 22 ||
          err.code === 1014)
      ) {
        throw err;
      }
      // Swallow any other write error (e.g. storage disabled in private mode).
    }
  }

  /**
   * Read the value stored at `key`, deserialise it from JSON, and return it.
   * Returns `fallback` for any failure — missing key, malformed JSON, or an
   * unavailable / security-restricted localStorage (Requirements 6.13, 9.8).
   *
   * @param {string} key
   * @param {*} fallback  Value returned when the key is absent or unreadable.
   * @returns {*}
   */
  function load(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      if (raw === null) {
        return fallback;
      }
      return JSON.parse(raw);
    } catch (err) {
      return fallback;
    }
  }

  /**
   * Remove the item at `key` from localStorage.
   * Errors are silently ignored — a missing key is a no-op.
   *
   * @param {string} key
   */
  function remove(key) {
    try {
      localStorage.removeItem(key);
    } catch (err) {
      // Silent on error.
    }
  }

  // Reveal only the public API.
  return {
    save: save,
    load: load,
    remove: remove,
  };
})();

// ─── ThemeManager ─────────────────────────────────────────────────────────────
// Manages two orthogonal theming dimensions on document.documentElement:
//   • data-theme  = "light" | "dark"  — toggled by the user
//   • data-period = "morning" | "afternoon" | "evening" | "night" — set by ClockModule
//
// Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6
var ThemeManager = (function () {
  'use strict';

  var STORAGE_KEY = 'dashboard:theme';
  var DEFAULT_THEME = 'light';

  // Compute the time-of-day period from a 0–23 hour value.
  function _computePeriod(hour) {
    if (hour >= 5 && hour <= 11) return 'morning';
    if (hour >= 12 && hour <= 17) return 'afternoon';
    if (hour >= 18 && hour <= 20) return 'evening';
    return 'night'; // 21–23 and 00–04
  }

  /**
   * Update the toggle button's icon, label, and aria attributes to match the
   * current data-theme on <html>.
   */
  function _syncToggleButton() {
    var btn = document.getElementById('theme-toggle-btn');
    var iconEl = document.getElementById('theme-toggle-icon');
    var labelEl = document.getElementById('theme-toggle-label');

    if (!btn) return; // guard: button may not exist in test environments

    var current = document.documentElement.getAttribute('data-theme') || DEFAULT_THEME;
    var isDark = current === 'dark';

    if (iconEl) iconEl.textContent = isDark ? '🌙' : '☀️';
    if (labelEl) labelEl.textContent = isDark ? 'Dark mode' : 'Light mode';

    btn.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
    btn.setAttribute('aria-pressed', isDark ? 'true' : 'false');
  }

  /**
   * Read saved theme from storage, apply data-theme and data-period to <html>,
   * persist the theme back (ensures the key always exists after first load),
   * and wire the toggle button's click handler.
   *
   * Requirements: 10.4, 10.5, 10.6
   */
  function init() {
    // Load persisted theme; fall back to DEFAULT_THEME on any error (10.5, 10.6).
    var savedTheme = StorageService.load(STORAGE_KEY, DEFAULT_THEME);

    // Validate — only accept the two known values.
    if (savedTheme !== 'light' && savedTheme !== 'dark') {
      savedTheme = DEFAULT_THEME;
    }

    // Apply data-theme (FOUC guard may have already set it; this keeps JS state
    // in sync and ensures the correct value is persisted).
    document.documentElement.setAttribute('data-theme', savedTheme);

    // Apply data-period based on the current hour.
    var currentHour = new Date().getHours();
    document.documentElement.setAttribute('data-period', _computePeriod(currentHour));

    // Persist the resolved theme back so the FOUC guard can read it next load.
    StorageService.save(STORAGE_KEY, savedTheme);

    // Sync button visual state.
    _syncToggleButton();

    // Wire toggle button.
    var btn = document.getElementById('theme-toggle-btn');
    if (btn) {
      btn.addEventListener('click', toggle);
    }
  }

  /**
   * Flip data-theme between "light" and "dark", persist to storage, and update
   * the toggle button's icon and label.
   *
   * Requirements: 10.1, 10.2, 10.3
   */
  function toggle() {
    var current = document.documentElement.getAttribute('data-theme') || DEFAULT_THEME;
    var next = current === 'dark' ? 'light' : 'dark';

    document.documentElement.setAttribute('data-theme', next);

    // Persist immediately (Requirement 10.3).
    StorageService.save(STORAGE_KEY, next);

    // Sync button to reflect new theme (Requirement 10.1).
    _syncToggleButton();
  }

  /**
   * Set data-period on <html>. Called by ClockModule whenever the time-of-day
   * period changes (Requirements 11.5, 11.6).
   *
   * @param {'morning'|'afternoon'|'evening'|'night'} period
   */
  function applyPeriod(period) {
    document.documentElement.setAttribute('data-period', period);
  }

  /**
   * Return the current data-theme attribute value.
   * Useful for other modules that need to know whether the UI is light or dark.
   *
   * @returns {'light'|'dark'}
   */
  function getCurrentTheme() {
    return document.documentElement.getAttribute('data-theme') || DEFAULT_THEME;
  }

  // Public API.
  return {
    init: init,
    toggle: toggle,
    applyPeriod: applyPeriod,
    getCurrentTheme: getCurrentTheme,
  };
})();

// ─── ClockModule ──────────────────────────────────────────────────────────────
// Owns the live clock tick (1-second setInterval), time/date DOM updates,
// time-of-day period detection, and greeting hour tracking.
//
// Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 11.5, 11.6
var ClockModule = (function () {
  'use strict';

  // Internal state: track the last-known period and hour so we only call
  // ThemeManager / GreetingModule when something actually changes.
  var _lastPeriod = null;
  var _lastHour = null;

  // Weekday and month name arrays used by _formatDate.
  var WEEKDAYS = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday',
    'Thursday', 'Friday', 'Saturday'
  ];
  var MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // ── Pure helpers ────────────────────────────────────────────────────────────

  /**
   * Return a zero-padded two-digit string for a given number.
   * @param {number} n
   * @returns {string}
   */
  function _pad(n) {
    return (n < 10 ? '0' : '') + n;
  }

  /**
   * Format a Date as "HH:MM:SS" (24-hour, zero-padded).
   * Returns "--:--:--" if the Date cannot be read.
   *
   * Pure function — no side effects.
   * Requirement 1.1
   *
   * @param {Date} d
   * @returns {string}
   */
  function _formatTime(d) {
    try {
      var h = d.getHours();
      var m = d.getMinutes();
      var s = d.getSeconds();
      // Accessing .getHours() on a non-Date or an invalid Date throws or returns NaN.
      if (isNaN(h) || isNaN(m) || isNaN(s)) {
        return '--:--:--';
      }
      return _pad(h) + ':' + _pad(m) + ':' + _pad(s);
    } catch (err) {
      return '--:--:--';
    }
  }

  /**
   * Format a Date as "Weekday, DD Month YYYY"
   * (e.g., "Thursday, 31 July 2026").
   * Returns "Date unavailable" if the Date cannot be read.
   *
   * Pure function — no side effects.
   * Requirement 1.2
   *
   * @param {Date} d
   * @returns {string}
   */
  function _formatDate(d) {
    try {
      var weekday = WEEKDAYS[d.getDay()];
      var day     = d.getDate();
      var month   = MONTHS[d.getMonth()];
      var year    = d.getFullYear();

      if (!weekday || isNaN(day) || !month || isNaN(year)) {
        return 'Date unavailable';
      }
      return weekday + ', ' + day + ' ' + month + ' ' + year;
    } catch (err) {
      return 'Date unavailable';
    }
  }

  /**
   * Map an hour (0–23) to a time-of-day period string.
   *
   * Pure function — no side effects.
   * Requirements 11.1–11.4
   *
   * @param {number} hour  Integer in 0–23
   * @returns {'morning'|'afternoon'|'evening'|'night'}
   */
  function _getPeriod(hour) {
    if (hour >= 5  && hour <= 11) return 'morning';
    if (hour >= 12 && hour <= 17) return 'afternoon';
    if (hour >= 18 && hour <= 20) return 'evening';
    return 'night'; // 21–23 and 00–04
  }

  /**
   * Map an hour (0–23) to a greeting salutation string.
   *
   * Pure function — no side effects.
   * Requirements 2.1–2.4
   *
   * @param {number} hour  Integer in 0–23
   * @returns {'Good Morning'|'Good Afternoon'|'Good Evening'}
   */
  function _getGreeting(hour) {
    if (hour >= 5  && hour <= 11) return 'Good Morning';
    if (hour >= 12 && hour <= 17) return 'Good Afternoon';
    return 'Good Evening'; // 18–23 and 00–04
  }

  // ── DOM-touching functions ──────────────────────────────────────────────────

  /**
   * Called every second by setInterval (and once immediately on init).
   * Gets the current Date, formats it, updates the DOM, and notifies
   * ThemeManager / GreetingModule when the period or hour changes.
   *
   * Requirements: 1.3, 1.4, 1.5, 11.5, 11.6
   */
  function _tick() {
    var timeStr, dateStr, hour, period;

    try {
      var now = new Date();
      hour    = now.getHours();
      period  = _getPeriod(hour);
      timeStr = _formatTime(now);
      dateStr = _formatDate(now);
    } catch (err) {
      // Requirement 1.5 — device time unavailable.
      timeStr = '--:--:--';
      dateStr = 'Date unavailable';
      hour    = null;
      period  = null;
    }

    // Update clock time display.
    var timeEl = document.getElementById('clock-time');
    if (timeEl) {
      timeEl.textContent = timeStr;
    }

    // Update clock date display.
    var dateEl = document.getElementById('clock-date');
    if (dateEl) {
      dateEl.textContent = dateStr;
    }

    // Only call ThemeManager.applyPeriod when the period has actually changed
    // (Requirements 11.5, 11.6).
    if (period !== null && period !== _lastPeriod) {
      _lastPeriod = period;
      if (typeof ThemeManager !== 'undefined' && ThemeManager.applyPeriod) {
        ThemeManager.applyPeriod(period);
      }
    }

    // Only call GreetingModule.updateGreeting when the hour has changed.
    // GreetingModule is defined later in app.js; guard against forward reference.
    if (hour !== null && hour !== _lastHour) {
      _lastHour = hour;
      if (typeof GreetingModule !== 'undefined' && GreetingModule.updateGreeting) {
        GreetingModule.updateGreeting(hour);
      }
    }
  }

  /**
   * Start the clock: fire an immediate tick then set a 1-second interval.
   *
   * Requirements: 1.3, 1.4
   */
  function init() {
    _tick(); // Render immediately so there is no blank state on load.
    setInterval(_tick, 1000);
  }

  // Public API — pure helpers are exposed so they can be manually tested in
  // the browser console (Tasks 4.2 / 3.3).
  return {
    init        : init,
    _tick       : _tick,
    _formatTime : _formatTime,
    _formatDate : _formatDate,
    _getPeriod  : _getPeriod,
    _getGreeting: _getGreeting,
  };
})();

// ─── GreetingModule ───────────────────────────────────────────────────────────
// Manages the personalised greeting heading and the name input / save form.
//
// Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9,
//               3.1, 3.2, 3.3, 3.4, 3.5
var GreetingModule = (function () {
  'use strict';

  var STORAGE_KEY = 'dashboard:username';

  // ── Pure helper ─────────────────────────────────────────────────────────────

  /**
   * Compose a full salutation string from a greeting word and a raw name.
   *
   * Pure function — no side effects.
   * Requirements 2.5, 2.6, 2.7
   *
   * @param {string} greeting  e.g. "Good Morning"
   * @param {string} name      raw name value (may be empty or whitespace)
   * @returns {string}
   *   - "<greeting>, <name.slice(0,50)>"  when trimmed name is non-empty
   *   - "<greeting>"                       when trimmed name is empty / whitespace
   */
  function _composeSalutation(greeting, name) {
    var trimmed = (name || '').trim();
    if (trimmed.length === 0) {
      return greeting;
    }
    // Truncate display to first 50 characters (Requirement 2.5).
    return greeting + ', ' + trimmed.slice(0, 50);
  }

  // ── DOM helpers ─────────────────────────────────────────────────────────────

  /** Return the greeting <h1> element, or null. */
  function _headingEl() {
    return document.getElementById('greeting-heading');
  }

  /** Return the name <input> element, or null. */
  function _inputEl() {
    return document.getElementById('name-input');
  }

  /** Return the error <span> element, or null. */
  function _errorEl() {
    return document.getElementById('name-input-error');
  }

  /**
   * Show an inline validation message in the error span.
   * Uses the `hidden` attribute so the span is visible only when there is an error.
   *
   * @param {string} message
   */
  function _showError(message) {
    var el = _errorEl();
    if (!el) return;
    el.textContent = message;
    el.removeAttribute('hidden');
  }

  /**
   * Clear the inline validation message and re-hide the error span.
   */
  function _clearError() {
    var el = _errorEl();
    if (!el) return;
    el.textContent = '';
    el.setAttribute('hidden', '');
  }

  // ── Public API ───────────────────────────────────────────────────────────────

  /**
   * Recompose the salutation and write it to the greeting heading.
   *
   * Called by ClockModule._tick() whenever the hour changes so the greeting
   * word stays in sync with the current time of day.
   *
   * Requirements: 2.1, 2.2, 2.3, 2.4
   *
   * @param {number} hour  Current hour (0–23)
   */
  function updateGreeting(hour) {
    var heading = _headingEl();
    if (!heading) return;

    var greeting = ClockModule._getGreeting(hour);
    var storedName = StorageService.load(STORAGE_KEY, '');
    heading.textContent = _composeSalutation(greeting, storedName);
  }

  /**
   * Validate and persist a new user name, then update the greeting.
   *
   * Requirements: 2.7, 2.8, 2.9, 3.2, 3.4
   *
   * @param {string} rawInput  Raw value from the name input field
   * @returns {{ok: boolean, error?: string}}
   */
  function saveName(rawInput) {
    var trimmed = (rawInput || '').trim();

    if (trimmed.length === 0) {
      // Empty / whitespace — show inline error; do NOT touch storage.
      // (Requirements 2.9, 3.4)
      _showError('Please enter your name.');
      return { ok: false, error: 'Name cannot be empty.' };
    }

    // Valid input — clear any previous error (Requirement 3.4).
    _clearError();

    // Persist the trimmed name (Requirement 2.8, 3.2).
    StorageService.save(STORAGE_KEY, trimmed);

    // Update the greeting heading immediately (Requirement 2.7).
    var currentHour = new Date().getHours();
    updateGreeting(currentHour);

    return { ok: true };
  }

  /**
   * Initialise the GreetingModule:
   *   1. Load the stored name and pre-populate the input field.
   *   2. Render the current greeting for the current hour.
   *   3. Wire the save-button click handler.
   *
   * Requirements: 2.6, 3.1, 3.3, 3.5
   */
  function init() {
    // Load persisted name (fallback to '' so _composeSalutation shows bare greeting).
    var storedName = StorageService.load(STORAGE_KEY, '');

    // Pre-populate the name input (Requirement 3.3).
    var input = _inputEl();
    if (input) {
      input.value = storedName;
    }

    // Render the greeting for the current hour (Requirements 2.1–2.4, 2.6).
    var currentHour = new Date().getHours();
    updateGreeting(currentHour);

    // Wire the save button (Requirement 3.1, 3.2).
    var saveBtn = document.getElementById('name-save-btn');
    if (saveBtn) {
      saveBtn.addEventListener('click', function () {
        var rawInput = _inputEl() ? _inputEl().value : '';
        saveName(rawInput);
      });
    }
  }

  // Expose public API.  _composeSalutation is also exposed for manual
  // console testing (Task 5.2 / Property 4).
  return {
    init               : init,
    saveName           : saveName,
    updateGreeting     : updateGreeting,
    _composeSalutation : _composeSalutation,
  };
})();

// ─── TimerModule ──────────────────────────────────────────────────────────────
// Manages the Pomodoro countdown timer: start/stop/reset, configurable duration,
// visual notification, and optional Web Audio API beep on completion.
//
// Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 4.10,
//               5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7
var TimerModule = (function () {
  'use strict';

  var STORAGE_KEY = 'dashboard:pomodoro-duration';
  var DEFAULT_DURATION_MINS = 25;

  // ── Internal state ──────────────────────────────────────────────────────────
  var _durationMins   = DEFAULT_DURATION_MINS; // full session duration in minutes
  var _remainingSecs  = DEFAULT_DURATION_MINS * 60; // seconds left in current session
  var _intervalId     = null;   // handle returned by setInterval
  // Tracks whether a session is currently running or paused (i.e., has been started
  // but not yet completed or reset).  'idle' covers the initial state and post-reset.
  // Values: 'idle' | 'running' | 'paused' | 'complete'
  var _sessionState   = 'idle';

  // ── Pure helpers ─────────────────────────────────────────────────────────────

  /**
   * Convert a total number of seconds to a zero-padded "MM:SS" string.
   * Supports up to 7200 seconds (120 minutes).
   *
   * Pure function — no side effects.
   * Requirements 4.1, 4.5  (Property 8)
   *
   * @param {number} secs  Non-negative integer, 0–7200
   * @returns {string}     e.g. "25:00", "00:00", "120:00"
   */
  function _formatTimer(secs) {
    var totalSecs = Math.max(0, Math.floor(secs));
    var mins = Math.floor(totalSecs / 60);
    var s    = totalSecs % 60;
    return (mins < 10 ? '0' : '') + mins + ':' + (s < 10 ? '0' : '') + s;
  }

  // ── DOM helpers ──────────────────────────────────────────────────────────────

  /** Return the #timer-display element or null. */
  function _displayEl() {
    return document.getElementById('timer-display');
  }

  /** Return the #timer-notification element or null. */
  function _notificationEl() {
    return document.getElementById('timer-notification');
  }

  /** Return the Start button or null. */
  function _startBtn() {
    return document.getElementById('timer-start-btn');
  }

  /** Return the Stop button or null. */
  function _stopBtn() {
    return document.getElementById('timer-stop-btn');
  }

  /** Return the Reset button or null. */
  function _resetBtn() {
    return document.getElementById('timer-reset-btn');
  }

  /** Return the duration number input or null. */
  function _durationInput() {
    return document.getElementById('timer-duration-input');
  }

  /** Return the duration save button or null. */
  function _durationSaveBtn() {
    return document.getElementById('timer-duration-save-btn');
  }

  /** Return the duration error span or null. */
  function _durationErrorEl() {
    return document.getElementById('timer-duration-error');
  }

  /**
   * Update the timer display text to reflect `_remainingSecs`.
   */
  function _updateDisplay() {
    var el = _displayEl();
    if (el) {
      el.textContent = _formatTimer(_remainingSecs);
    }
  }

  /**
   * Show or hide the inline duration validation error message.
   *
   * @param {string|null} message  Pass a string to show; null/'' to hide.
   */
  function _setDurationError(message) {
    var el = _durationErrorEl();
    if (!el) return;
    if (message) {
      el.textContent = message;
      el.removeAttribute('hidden');
    } else {
      el.textContent = '';
      el.setAttribute('hidden', '');
    }
  }

  // ── Core timer controls ──────────────────────────────────────────────────────

  /**
   * Update Start/Stop button disabled states based on timer state.
   * Requirements 4.8, 4.9, 4.10
   *
   * @param {'running'|'paused'|'complete'} state
   */
  function _updateButtons(state) {
    var startBtn = _startBtn();
    var stopBtn  = _stopBtn();

    if (!startBtn || !stopBtn) return;

    if (state === 'running') {
      // Requirement 4.8: disable Start, enable Stop while counting down.
      startBtn.disabled = true;
      stopBtn.disabled  = false;
    } else if (state === 'paused') {
      // Requirement 4.9: enable Start, disable Stop while paused/reset.
      startBtn.disabled = false;
      stopBtn.disabled  = true;
    } else if (state === 'complete') {
      // Requirement 4.10: both disabled at 00:00; Start stays disabled.
      startBtn.disabled = true;
      stopBtn.disabled  = true;
    }
  }

  /**
   * Display the completion notification for ≥ 3 seconds and optionally emit
   * an audible beep via Web Audio API.
   * Requirements 4.7
   */
  function _notify() {
    // Show visible notification (Requirement 4.7).
    var notifEl = _notificationEl();
    if (notifEl) {
      notifEl.textContent = 'Session complete! Great work.';
      notifEl.removeAttribute('hidden');
      // Hide after 3 seconds (≥ 3 s requirement).
      setTimeout(function () {
        notifEl.setAttribute('hidden', '');
        notifEl.textContent = '';
      }, 3000);
    }

    // Audible beep using Web Audio API if available (Requirement 4.7).
    // Silently skip if unavailable.
    try {
      var AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      var ctx        = new AudioCtx();
      var oscillator = ctx.createOscillator();
      var gainNode   = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.type      = 'sine';
      oscillator.frequency.setValueAtTime(440, ctx.currentTime); // 440 Hz — A4
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);

      oscillator.start(ctx.currentTime);
      // Beep for 1 second (≥ 1 s requirement).
      oscillator.stop(ctx.currentTime + 1);

      // Fade out slightly before stop to avoid click artefact.
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime + 0.8);
      gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 1);

      oscillator.onended = function () {
        ctx.close();
      };
    } catch (err) {
      // Silently skip any audio error (e.g. AudioContext not supported or blocked).
    }
  }

  /**
   * Called every second by setInterval while the timer is running.
   * Decrements remaining time, updates the display, and handles completion.
   * Requirement 4.3, 4.6
   */
  function _tick() {
    _remainingSecs -= 1;
    _updateDisplay();

    if (_remainingSecs <= 0) {
      _remainingSecs = 0; // clamp in case of any drift
      _updateDisplay();

      // Stop the interval.
      if (_intervalId !== null) {
        clearInterval(_intervalId);
        _intervalId = null;
      }

      _sessionState = 'complete';
      _updateButtons('complete'); // Requirement 4.6, 4.8
      _notify();                  // Requirement 4.7
    }
  }

  // ── Public API ───────────────────────────────────────────────────────────────

  /**
   * Load persisted duration from storage, initialise remaining seconds,
   * render the display, and put buttons into paused state.
   * Requirements 4.2, 5.6
   */
  function init() {
    _durationMins  = StorageService.load(STORAGE_KEY, DEFAULT_DURATION_MINS);

    // Validate loaded value; fall back to default if corrupt.
    if (
      typeof _durationMins !== 'number' ||
      !Number.isInteger(_durationMins) ||
      _durationMins < 1 ||
      _durationMins > 120
    ) {
      _durationMins = DEFAULT_DURATION_MINS;
    }

    _remainingSecs = _durationMins * 60;
    _sessionState  = 'idle';

    _updateDisplay();
    _updateButtons('paused');

    // Pre-populate the duration input with the stored/default value.
    var inputEl = _durationInput();
    if (inputEl) {
      inputEl.value = _durationMins;
    }

    // Wire Start button.
    var startBtn = _startBtn();
    if (startBtn) {
      startBtn.addEventListener('click', start);
    }

    // Wire Stop button.
    var stopBtn = _stopBtn();
    if (stopBtn) {
      stopBtn.addEventListener('click', stop);
    }

    // Wire Reset button.
    var resetBtn = _resetBtn();
    if (resetBtn) {
      resetBtn.addEventListener('click', reset);
    }

    // Wire duration Save button.
    var saveBtn = _durationSaveBtn();
    if (saveBtn) {
      saveBtn.addEventListener('click', function () {
        var inputEl2 = _durationInput();
        var rawValue = inputEl2 ? inputEl2.value : '';
        setDuration(rawValue);
      });
    }
  }

  /**
   * Begin the countdown.
   * Guard: if remaining ≤ 0 do nothing (Requirement 4.10).
   * Requirements 4.3, 4.8
   */
  function start() {
    if (_remainingSecs <= 0) {
      return; // Requirement 4.10 — Start is a no-op at 00:00
    }

    // Prevent double-starting if already running.
    if (_intervalId !== null) return;

    _sessionState = 'running';
    _intervalId   = setInterval(_tick, 1000);
    _updateButtons('running'); // Requirement 4.8
  }

  /**
   * Pause the countdown; retain remaining seconds.
   * Requirements 4.4, 4.9
   */
  function stop() {
    if (_intervalId !== null) {
      clearInterval(_intervalId);
      _intervalId = null;
    }
    _sessionState = 'paused';
    _updateButtons('paused'); // Requirement 4.9
  }

  /**
   * Stop the countdown and restore the display to the full duration.
   * Requirements 4.5, 4.9
   */
  function reset() {
    if (_intervalId !== null) {
      clearInterval(_intervalId);
      _intervalId = null;
    }

    _remainingSecs = _durationMins * 60;
    _sessionState  = 'idle';

    // Update display within 200ms (synchronous — satisfies the ≤ 200ms constraint).
    _updateDisplay();
    _updateButtons('paused'); // Requirement 4.9
  }

  /**
   * Validate and persist a new Pomodoro duration.
   *
   * Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.7
   *
   * @param {string|number} minutes  Raw input value (may be a string from the DOM)
   * @returns {{ok: boolean, error?: string}}
   */
  function setDuration(minutes) {
    var parsed = Number(minutes);

    // Validation: must be an integer in [1, 120] (Requirement 5.2, 5.5).
    var isValid =
      !isNaN(parsed) &&
      Number.isInteger(parsed) &&
      parsed >= 1 &&
      parsed <= 120;

    if (!isValid) {
      // Show inline validation message (Requirement 5.5).
      _setDurationError('Please enter a whole number between 1 and 120.');
      return { ok: false, error: 'Duration must be a whole number between 1 and 120.' };
    }

    // Clear any previous error.
    _setDurationError(null);

    // Persist to storage (Requirement 5.4).
    StorageService.save(STORAGE_KEY, parsed);

    // Update stored duration.
    _durationMins = parsed;

    // Update the duration input to reflect the validated value.
    var inputEl = _durationInput();
    if (inputEl) {
      inputEl.value = parsed;
    }

    // Only apply to display if no session is currently running or paused
    // (i.e., timer is idle or complete). Requirement 5.3, 5.7.
    if (_sessionState !== 'running' && _sessionState !== 'paused') {
      _remainingSecs = _durationMins * 60;
      _updateDisplay();
    }

    return { ok: true };
  }

  // Expose public API.  Pure helper _formatTimer is also exposed for
  // manual console testing (Task 6.2 / Property 8).
  return {
    init         : init,
    start        : start,
    stop         : stop,
    reset        : reset,
    setDuration  : setDuration,
    _formatTimer : _formatTimer,
  };
})();

// ─── TaskModule ───────────────────────────────────────────────────────────────
// Manages the task list: CRUD, duplicate detection, sort, and persistence.
// Requirements: 6.1–6.13, 7.1–7.4, 8.1–8.6, 13.5
var TaskModule = (function () {
  'use strict';

  var STORAGE_KEY = 'dashboard:tasks';

  // ── Internal state ──────────────────────────────────────────────────────────
  var _tasks       = [];   // in-memory task array
  var _sortOrder   = 'default';
  var _nextIndex   = 0;    // monotonically increasing insertion index

  // ── Pure helpers (Tasks 8.1 / Properties 5, 6, 7) ──────────────────────────

  /**
   * Validate a task description.
   * @param {string} description
   * @returns {{ok: boolean, error?: string}}
   */
  function _validate(description) {
    var trimmed = (description || '').trim();
    if (trimmed.length === 0) {
      return { ok: false, error: 'required' };
    }
    if (trimmed.length > 200) {
      return { ok: false, error: 'max200' };
    }
    return { ok: true };
  }

  /**
   * Check whether a description already exists in the task list.
   * Case-insensitive, trim-invariant. Excludes the task with excludeId.
   * @param {string} desc
   * @param {Array}  tasks
   * @param {string|null} excludeId
   * @returns {boolean}
   */
  function _isDuplicate(desc, tasks, excludeId) {
    var normalised = (desc || '').trim().toLowerCase();
    for (var i = 0; i < tasks.length; i++) {
      if (tasks[i].id === excludeId) continue;
      if ((tasks[i].description || '').trim().toLowerCase() === normalised) {
        return true;
      }
    }
    return false;
  }

  /**
   * Return a new sorted array without mutating the input.
   * @param {Array}  tasks
   * @param {string} order  'default' | 'status' | 'alphabetical'
   * @returns {Array}
   */
  function _sortTasks(tasks, order) {
    var copy = tasks.slice();
    if (order === 'status') {
      copy.sort(function (a, b) {
        // Incomplete (false) before complete (true)
        var aVal = a.completed ? 1 : 0;
        var bVal = b.completed ? 1 : 0;
        if (aVal !== bVal) return aVal - bVal;
        return a.insertionIndex - b.insertionIndex;
      });
    } else if (order === 'alphabetical') {
      copy.sort(function (a, b) {
        var cmp = (a.description || '').toLowerCase()
          .localeCompare((b.description || '').toLowerCase());
        if (cmp !== 0) return cmp;
        return a.insertionIndex - b.insertionIndex;
      });
    } else {
      // 'default' — insertion order
      copy.sort(function (a, b) {
        return a.insertionIndex - b.insertionIndex;
      });
    }
    return copy;
  }

  // ── DOM helpers ──────────────────────────────────────────────────────────────

  function _listEl()      { return document.getElementById('task-list'); }
  function _inputEl()     { return document.getElementById('task-input'); }
  function _errorEl()     { return document.getElementById('task-input-error'); }
  function _addBtnEl()    { return document.getElementById('task-add-btn'); }
  function _sortSelectEl(){ return document.getElementById('task-sort-select'); }

  function _showInputError(msg) {
    var el = _errorEl();
    if (!el) return;
    el.textContent = msg;
    el.removeAttribute('hidden');
  }

  function _clearInputError() {
    var el = _errorEl();
    if (!el) return;
    el.textContent = '';
    el.setAttribute('hidden', '');
  }

  function _showBanner(msg) {
    var list = _listEl();
    if (!list) return;
    var banner = document.createElement('div');
    banner.className = 'banner banner--error';
    banner.textContent = msg;
    list.insertAdjacentElement('beforebegin', banner);
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  function _render() {
    var list = _listEl();
    if (!list) return;

    var sorted = _sortTasks(_tasks, _sortOrder);
    list.innerHTML = '';

    sorted.forEach(function (task) {
      var li = document.createElement('li');
      li.className = 'task-item' + (task.completed ? ' completed' : '');
      li.setAttribute('data-id', task.id);

      // Checkbox
      var checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = task.completed;
      checkbox.setAttribute('aria-label', 'Mark complete: ' + task.description);
      checkbox.addEventListener('change', function () {
        toggleTask(task.id);
      });

      // Description span
      var span = document.createElement('span');
      span.className = 'task-description';
      span.textContent = task.description;

      // Edit button
      var editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.textContent = 'Edit';
      editBtn.setAttribute('aria-label', 'Edit task: ' + task.description);
      editBtn.addEventListener('click', function () {
        _activateEditMode(li, task);
      });

      // Delete button
      var delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.textContent = 'Delete';
      delBtn.setAttribute('aria-label', 'Delete task: ' + task.description);
      delBtn.addEventListener('click', function () {
        deleteTask(task.id);
      });

      li.appendChild(checkbox);
      li.appendChild(span);
      li.appendChild(editBtn);
      li.appendChild(delBtn);
      list.appendChild(li);
    });
  }

  function _activateEditMode(li, task) {
    // Switch the <li> to column layout so the input row gets the full width
    li.classList.add('editing');
    li.innerHTML = '';

    // ── Input row ────────────────────────────────────────────────────────────
    var editRow = document.createElement('div');
    editRow.className = 'task-edit-row';

    var editInput = document.createElement('input');
    editInput.type = 'text';
    editInput.className = 'task-edit-input';
    editInput.maxLength = 200;
    editInput.setAttribute('aria-label', 'Edit task description');

    // Look up the live task object so we always get the current description,
    // even if _render() was called since the edit button was first rendered.
    var liveTask = null;
    for (var i = 0; i < _tasks.length; i++) {
      if (_tasks[i].id === task.id) { liveTask = _tasks[i]; break; }
    }
    editInput.value = liveTask ? liveTask.description : task.description;

    editRow.appendChild(editInput);

    // ── Validation message ───────────────────────────────────────────────────
    var errorSpan = document.createElement('span');
    errorSpan.setAttribute('role', 'alert');
    errorSpan.className = 'validation-msg';
    errorSpan.setAttribute('hidden', '');

    // ── Action buttons row ───────────────────────────────────────────────────
    var actionsRow = document.createElement('div');
    actionsRow.className = 'task-edit-actions';

    var saveBtn = document.createElement('button');
    saveBtn.type = 'button';
    saveBtn.textContent = 'Save';
    saveBtn.addEventListener('click', function () {
      var result = editTask(task.id, editInput.value);
      if (!result.ok) {
        errorSpan.textContent = result.error;
        errorSpan.removeAttribute('hidden');
      }
    });

    var cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.addEventListener('click', function () {
      _render();
    });

    actionsRow.appendChild(saveBtn);
    actionsRow.appendChild(cancelBtn);

    li.appendChild(editRow);
    li.appendChild(errorSpan);
    li.appendChild(actionsRow);
    editInput.focus();
    // Place cursor at end of existing text
    editInput.setSelectionRange(editInput.value.length, editInput.value.length);
  }

  // ── Public CRUD methods ───────────────────────────────────────────────────────

  function init() {
    var loaded = StorageService.load(STORAGE_KEY, []);
    if (!Array.isArray(loaded)) {
      _tasks = [];
      _showBanner('Could not load saved tasks. Starting with an empty list.');
    } else {
      _tasks = loaded;
      // Restore _nextIndex to avoid collisions
      _tasks.forEach(function (t) {
        if (typeof t.insertionIndex === 'number' && t.insertionIndex >= _nextIndex) {
          _nextIndex = t.insertionIndex + 1;
        }
      });
    }

    _render();

    // Wire Add button
    var addBtn = _addBtnEl();
    if (addBtn) {
      addBtn.addEventListener('click', function () {
        var input = _inputEl();
        addTask(input ? input.value : '');
      });
    }

    // Wire Enter key on input
    var input = _inputEl();
    if (input) {
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          addTask(input.value);
        }
      });
    }

    // Wire sort select
    var sortSel = _sortSelectEl();
    if (sortSel) {
      sortSel.addEventListener('change', function () {
        setSortOrder(sortSel.value);
      });
    }
  }

  function addTask(rawDescription) {
    var trimmed = (rawDescription || '').trim();

    var validation = _validate(trimmed);
    if (!validation.ok) {
      var msg = validation.error === 'max200'
        ? 'Task must be 200 characters or fewer.'
        : 'Please enter a task description.';
      _showInputError(msg);
      return { ok: false, error: msg };
    }

    if (_isDuplicate(trimmed, _tasks, null)) {
      var dupMsg = 'A task with that description already exists.';
      _showInputError(dupMsg);
      return { ok: false, error: dupMsg };
    }

    _clearInputError();

    _tasks.push({
      id: Date.now().toString(),
      description: trimmed,
      completed: false,
      insertionIndex: _nextIndex++
    });

    StorageService.save(STORAGE_KEY, _tasks);
    _render();

    // Clear input
    var input = _inputEl();
    if (input) input.value = '';

    return { ok: true };
  }

  function editTask(id, newDescription) {
    var trimmed = (newDescription || '').trim();

    var validation = _validate(trimmed);
    if (!validation.ok) {
      var msg = validation.error === 'max200'
        ? 'Task must be 200 characters or fewer.'
        : 'Please enter a task description.';
      return { ok: false, error: msg };
    }

    if (_isDuplicate(trimmed, _tasks, id)) {
      return { ok: false, error: 'A task with that description already exists.' };
    }

    for (var i = 0; i < _tasks.length; i++) {
      if (_tasks[i].id === id) {
        _tasks[i].description = trimmed;
        break;
      }
    }

    StorageService.save(STORAGE_KEY, _tasks);
    _render();
    return { ok: true };
  }

  function toggleTask(id) {
    for (var i = 0; i < _tasks.length; i++) {
      if (_tasks[i].id === id) {
        _tasks[i].completed = !_tasks[i].completed;
        break;
      }
    }
    StorageService.save(STORAGE_KEY, _tasks);
    _render();
  }

  function deleteTask(id) {
    _tasks = _tasks.filter(function (t) { return t.id !== id; });
    StorageService.save(STORAGE_KEY, _tasks);
    _render();
  }

  function setSortOrder(order) {
    _sortOrder = order;
    _render();
  }

  return {
    init        : init,
    addTask     : addTask,
    editTask    : editTask,
    toggleTask  : toggleTask,
    deleteTask  : deleteTask,
    setSortOrder: setSortOrder,
    // Expose pure helpers for manual console testing (Tasks 8.2, 8.4)
    _validate   : _validate,
    _isDuplicate: _isDuplicate,
    _sortTasks  : _sortTasks,
  };
})();

// ─── QuickLinksModule ─────────────────────────────────────────────────────────
// Manages shortcut links: add, delete, persist, render.
// Requirements: 9.1–9.9
var QuickLinksModule = (function () {
  'use strict';

  var STORAGE_KEY = 'dashboard:links';
  var _links = [];

  // ── Pure helpers (Property 9) ────────────────────────────────────────────────

  function _validateLabel(label) {
    var trimmed = (label || '').trim();
    if (trimmed.length === 0 || trimmed.length > 50) {
      return { ok: false };
    }
    return { ok: true };
  }

  function _validateUrl(url) {
    if (!url || typeof url !== 'string') return false;
    return url.indexOf('http://') === 0 || url.indexOf('https://') === 0;
  }

  // ── DOM helpers ──────────────────────────────────────────────────────────────

  function _listEl()       { return document.getElementById('link-list'); }
  function _labelInputEl() { return document.getElementById('link-label-input'); }
  function _urlInputEl()   { return document.getElementById('link-url-input'); }
  function _labelErrorEl() { return document.getElementById('link-label-error'); }
  function _urlErrorEl()   { return document.getElementById('link-url-error'); }

  function _showLabelError(msg) {
    var el = _labelErrorEl();
    if (!el) return;
    el.textContent = msg;
    el.removeAttribute('hidden');
  }
  function _clearLabelError() {
    var el = _labelErrorEl();
    if (!el) return;
    el.textContent = '';
    el.setAttribute('hidden', '');
  }
  function _showUrlError(msg) {
    var el = _urlErrorEl();
    if (!el) return;
    el.textContent = msg;
    el.removeAttribute('hidden');
  }
  function _clearUrlError() {
    var el = _urlErrorEl();
    if (!el) return;
    el.textContent = '';
    el.setAttribute('hidden', '');
  }

  function _showWarningBanner(msg) {
    var list = _listEl();
    if (!list) return;
    var banner = document.createElement('div');
    banner.className = 'banner banner--warning';
    banner.textContent = msg;
    list.insertAdjacentElement('beforebegin', banner);
    setTimeout(function () { banner.remove(); }, 5000);
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  function _render() {
    var list = _listEl();
    if (!list) return;
    list.innerHTML = '';

    _links.forEach(function (link) {
      var item = document.createElement('div');
      item.setAttribute('role', 'listitem');
      item.className = 'quick-link-item';

      var linkBtn = document.createElement('button');
      linkBtn.type = 'button';
      linkBtn.className = 'quick-link-btn';
      linkBtn.textContent = link.label;
      linkBtn.addEventListener('click', function () {
        window.open(link.url, '_blank', 'noopener');
      });

      var delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'quick-link-delete';
      delBtn.textContent = '✕';
      delBtn.setAttribute('aria-label', 'Delete ' + link.label);
      delBtn.addEventListener('click', function () {
        deleteLink(link.id);
      });

      item.appendChild(linkBtn);
      item.appendChild(delBtn);
      list.appendChild(item);
    });
  }

  // ── Public API ────────────────────────────────────────────────────────────────

  function init() {
    var loaded = StorageService.load(STORAGE_KEY, []);
    if (!Array.isArray(loaded)) {
      _links = [];
      var list = _listEl();
      if (list) {
        var banner = document.createElement('div');
        banner.className = 'banner banner--error';
        banner.textContent = 'Could not load saved links. Starting with an empty list.';
        list.insertAdjacentElement('beforebegin', banner);
      }
    } else {
      _links = loaded;
    }

    _render();

    var addBtn = document.getElementById('link-add-btn');
    if (addBtn) {
      addBtn.addEventListener('click', function () {
        var label = _labelInputEl() ? _labelInputEl().value : '';
        var url   = _urlInputEl()   ? _urlInputEl().value   : '';
        addLink(label, url);
      });
    }
  }

  function addLink(label, url) {
    var labelValid = _validateLabel(label);
    var urlValid   = _validateUrl(url);
    var hasError   = false;

    if (!labelValid.ok) {
      _showLabelError('Label is required and must be 50 characters or fewer.');
      hasError = true;
    } else {
      _clearLabelError();
    }

    if (!urlValid) {
      _showUrlError('URL must start with http:// or https://');
      hasError = true;
    } else {
      _clearUrlError();
    }

    if (hasError) return;

    var newLink = {
      id   : Date.now().toString(),
      label: label.trim(),
      url  : url.trim()
    };
    _links.push(newLink);

    try {
      StorageService.save(STORAGE_KEY, _links);
    } catch (err) {
      _showWarningBanner('Link added but could not be saved — it may not persist after reload.');
    }

    _render();

    // Clear inputs on success
    if (_labelInputEl()) _labelInputEl().value = '';
    if (_urlInputEl())   _urlInputEl().value   = '';
  }

  function deleteLink(id) {
    _links = _links.filter(function (l) { return l.id !== id; });
    StorageService.save(STORAGE_KEY, _links);
    _render();
  }

  return {
    init          : init,
    addLink       : addLink,
    deleteLink    : deleteLink,
    // Expose pure helpers for console testing (Task 9.2 / Property 9)
    _validateLabel: _validateLabel,
    _validateUrl  : _validateUrl,
  };
})();

// ─── BlobBackground ───────────────────────────────────────────────────────────
// Injects 3 absolutely-positioned blob divs into <body> and keeps their
// color in sync with the current time-of-day period via CSS custom properties
// on [data-period]. Animation is handled entirely by CSS @keyframes.
var BlobBackground = (function () {
  'use strict';

  var _container = null;

  function init() {
    // Create the fixed container
    _container = document.createElement('div');
    _container.className = 'blob-container';
    _container.setAttribute('aria-hidden', 'true');

    // Create 3 blobs
    for (var i = 1; i <= 3; i++) {
      var blob = document.createElement('div');
      blob.className = 'blob blob-' + i;
      _container.appendChild(blob);
    }

    // Insert as the first child of <body> so it's behind everything
    document.body.insertBefore(_container, document.body.firstChild);
  }

  return { init: init };
})();

// ─── Bootstrap ────────────────────────────────────────────────────────────────
// Initialise all modules in dependency order once the DOM is ready.
// Requirements: 1.3, 2.7, 11.5, 11.6, 12.6
document.addEventListener('DOMContentLoaded', function () {
  // StorageService needs no init — it is ready as soon as it is defined.
  BlobBackground.init();   // inject blobs before other modules run
  ThemeManager.init();
  ClockModule.init();
  GreetingModule.init();
  TimerModule.init();
  TaskModule.init();
  QuickLinksModule.init();
});
