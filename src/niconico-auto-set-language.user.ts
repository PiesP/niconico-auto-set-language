// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

// ==UserScript==
// @name         NicoNico Auto Set Language
// @namespace    https://github.com/PiesP/niconico-auto-set-language
// @version      0.10.0
// @license      MIT
// @description  Automatically set language to Japanese on NicoNico.
// @match        https://www.nicovideo.jp/*
// @match        https://nicovideo.jp/*
// @grant        GM_registerMenuCommand
// @grant        GM_setValue
// @grant        GM_getValue
// @noframes
// @run-at     document-end
// ==/UserScript==

// ── Logger ──
const PREFIX = '[NicoNico Language]';
const Logger = {
  debug: (...args: unknown[]) => console.debug(PREFIX, ...args),
  info: (...args: unknown[]) => console.info(PREFIX, ...args),
  warn: (...args: unknown[]) => console.warn(PREFIX, ...args),
  error: (...args: unknown[]) => console.error(PREFIX, ...args),
};

(() => {
  const TARGET_LANGUAGE = 'ja-jp';
  const OBSERVE_TIMEOUT_MS = 5000;
  const CHECK_DEBOUNCE_MS = 100;
  const TOAST_DURATION_MS = 2500;
  const TOAST_FADE_OUT_MS = 300;
  const STORAGE_KEY_ENABLED = 'nicoauto-enabled';

  // Centralized DOM selectors — update these if NicoNico changes its markup.
  const SELECTOR_LANGUAGE_INPUT = 'form input[name="language"]';
  const SELECTOR_WATCH_PAGE_CONTAINER = '#watch-page-container';
  const SELECTOR_WATCH_CONTAINER = '.watch-container';
  const SELECTOR_NAV_CONTAINER_BROAD = '#root, .BaseUniLayout-main';
  const NICONICO_DOMAIN = 'nicovideo.jp';
  const NICONICO_DOMAIN_SUFFIX = `.${NICONICO_DOMAIN}`;

  const TOAST_BASE_STYLE =
    'position:fixed;top:10px;right:10px;color:#fff;padding:10px 12px;border-radius:6px;z-index:2147483647;font:13px/1.4 system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;box-shadow:0 2px 10px rgba(0,0,0,.18);cursor:pointer;transition:transform 0.15s;background:';

  const TOAST_COLORS: Record<'error' | 'info' | 'success', string> = {
    error: '#f44336',
    info: '#2196F3',
    success: '#4CAF50',
  };

  // SSOT: GM storage is the single source of truth for enabled state
  function isEnabled(): boolean {
    if (typeof GM_getValue !== 'function') return true;
    return GM_getValue<boolean>(STORAGE_KEY_ENABLED, true);
  }

  function setEnabled(value: boolean): void {
    if (typeof GM_setValue !== 'function') {
      Logger.warn(
        'GM_setValue unavailable — toggle state not persisted. ' +
          'Check that @grant GM_setValue is declared in the userscript header.'
      );
      return;
    }
    GM_setValue(STORAGE_KEY_ENABLED, value);
  }

  // Unified lifecycle state: IDLE → WATCHING → SUBMITTED → IDLE
  enum WatchState {
    IDLE = 'idle',
    WATCHING = 'watching',
    SUBMITTED = 'submitted',
  }

  let watchState: WatchState = WatchState.IDLE;
  let observer: MutationObserver | null = null;
  let observeTimeout: ReturnType<typeof window.setTimeout> | null = null;
  let debounceTimer: ReturnType<typeof window.setTimeout> | null = null;
  let navObserver: MutationObserver | null = null;
  let navApiRegistered = false;
  let currentToast: { el: HTMLDivElement; timers: ReturnType<typeof window.setTimeout>[] } | null =
    null;

  function toast(message: string, type: 'success' | 'error' | 'info' = 'success'): void {
    if (!document.body) return;

    // Remove existing toast before showing a new one
    clearAllToasts();

    const el = document.createElement('div');
    el.textContent = message;
    el.style.cssText = TOAST_BASE_STYLE + TOAST_COLORS[type];
    el.setAttribute('role', 'alert');
    el.setAttribute('aria-live', 'assertive');
    el.setAttribute('tabindex', '0');

    // Allow keyboard dismiss: clicking removes the toast.
    el.addEventListener('click', () => removeToast());

    // Focus-visible outline: visual indicator for keyboard navigation
    el.addEventListener('focus', () => {
      el.style.outline = '2px solid #fff';
      el.style.outlineOffset = '2px';
    });
    el.addEventListener('blur', () => {
      el.style.outline = '';
      el.style.outlineOffset = '';
    });

    // Hover: slight scale-up for visual feedback
    el.addEventListener('mouseenter', () => {
      el.style.transform = 'scale(1.04)';
    });
    el.addEventListener('mouseleave', () => {
      el.style.transform = '';
    });

    document.body.appendChild(el);
    const timers: ReturnType<typeof window.setTimeout>[] = [];
    const fadeTimer = window.setTimeout(() => {
      el.style.transition = 'opacity 0.3s';
      el.style.opacity = '0';
      const removeTimer = window.setTimeout(() => {
        removeToast();
      }, TOAST_FADE_OUT_MS);
      timers.push(removeTimer);
    }, TOAST_DURATION_MS);
    timers.push(fadeTimer);
    currentToast = { el, timers };
  }

  function removeToast(): void {
    if (currentToast === null) return;
    for (const id of currentToast.timers) window.clearTimeout(id);
    currentToast.el.remove();
    currentToast = null;
  }

  /** Semantic wrapper for readability at call sites (Escape handler, disable flow). */
  function clearAllToasts(): void {
    removeToast();
  }

  // Global Escape key handler to dismiss all active toasts.
  // Named reference so it can be removed in stopWatching().
  function handleKeydown(e: KeyboardEvent): void {
    if (e.key === 'Escape') clearAllToasts();
  }

  function startEscapeHandler(): void {
    document.addEventListener('keydown', handleKeydown);
  }

  function findWatchContainer(): Element | null {
    return (
      document.querySelector(SELECTOR_WATCH_PAGE_CONTAINER) ??
      document.querySelector(SELECTOR_WATCH_CONTAINER)
    );
  }

  /**
   * Find the best available container for navigation observation.
   * Tries watch-specific containers first, then broader page containers
   * that exist across NicoNico's different layout types (React-based
   * watch pages use #root; classic pages use .BaseUniLayout-main).
   * Returns null if no container is found — callers should NOT fall back
   * to document.body due to the extreme mutation overhead on content-heavy
   * NicoNico pages (live comments, ads, sidebar DOM churn).
   */
  function findNavContainer(): Element | null {
    return findWatchContainer() ?? document.querySelector(SELECTOR_NAV_CONTAINER_BROAD);
  }

  function stopWatching(): void {
    if (debounceTimer !== null) {
      window.clearTimeout(debounceTimer);
      debounceTimer = null;
    }
    if (observeTimeout !== null) {
      window.clearTimeout(observeTimeout);
      observeTimeout = null;
    }
    if (observer !== null) {
      observer.disconnect();
      observer = null;
    }
    if (navObserver !== null) {
      navObserver.disconnect();
      navObserver = null;
    }
    if (navApiRegistered) {
      if (
        typeof navigation !== 'undefined' &&
        typeof navigation.removeEventListener === 'function'
      ) {
        navigation.removeEventListener('navigate', checkNavigation);
      }
      navApiRegistered = false;
    }
    if (navDebounceTimer !== null) {
      window.clearTimeout(navDebounceTimer);
      navDebounceTimer = null;
    }
    window.removeEventListener('popstate', checkNavigation);
    document.removeEventListener('keydown', handleKeydown);
    watchState = WatchState.IDLE;
    clearAllToasts();
  }

  /**
   * Locate the language form. Try multiple selector strategies to stay
   * resilient against minor DOM restructuring on NicoNico's side.
   */
  function findLanguageForm(): {
    form: HTMLFormElement;
    input: HTMLInputElement | HTMLSelectElement;
  } | null {
    // Strategy 1: input with name="language" inside a form (original approach)
    const input = document.querySelector<HTMLInputElement>(SELECTOR_LANGUAGE_INPUT);
    if (input) {
      const form = input.form ?? input.closest('form');
      if (form instanceof HTMLFormElement) return { form, input };
    }

    // Strategy 2: any form that has an input with "lang" in the name or a language testid
    const fallbackInput = document.querySelector<HTMLInputElement | HTMLSelectElement>(
      'input[name="lang"],[data-testid="language-select"]'
    );
    if (fallbackInput instanceof HTMLInputElement || fallbackInput instanceof HTMLSelectElement) {
      const form = fallbackInput.closest('form');
      if (form instanceof HTMLFormElement) {
        return { form, input: fallbackInput };
      }
    }

    return null;
  }

  /** Pure function: validates that a form action URL is safe to submit */
  function isFormActionSafeAction(actionHref: string, origin: string): boolean {
    // Empty action = submit to current page (same-origin) — always safe.
    if (!actionHref) return true;
    try {
      const url = new URL(actionHref, origin);
      if (url.origin === origin) return true;
      return url.hostname === NICONICO_DOMAIN || url.hostname.endsWith(NICONICO_DOMAIN_SUFFIX);
    } catch {
      return false;
    }
  }

  /**
   * Validate that a form's action URL is safe to submit — must be same-origin
   * or match *.nicovideo.jp to prevent credential leakage to third parties.
   */
  function isFormActionSafe(form: HTMLFormElement): boolean {
    return isFormActionSafeAction(form.action, window.location.origin);
  }

  function tryChangeLanguage(): boolean {
    if (watchState === WatchState.SUBMITTED) return true;
    if (!isEnabled()) return false;

    const found = findLanguageForm();
    if (!found) return false;

    if (!isFormActionSafe(found.form)) {
      Logger.warn('Skipping form submission: action URL is not safe:', found.form.action);
      return false;
    }

    try {
      // Language already matches — nothing to do.
      if (found.input.value === TARGET_LANGUAGE) return true;

      found.input.value = TARGET_LANGUAGE;
      toast('Changing language to Japanese...', 'info');

      // Set state to SUBMITTED BEFORE submit() to prevent retry loops.
      // If submit() throws, we reset it in the catch block.
      watchState = WatchState.SUBMITTED;
      found.form.submit();
      stopWatching();
      return true;
    } catch (err) {
      Logger.error('Failed to submit language form:', err);
      toast('Failed to change language.', 'error');
      stopWatching();
      return false;
    }
  }

  function watchForLanguageForm(): void {
    if (watchState === WatchState.WATCHING) return;
    watchState = WatchState.WATCHING;

    // Scope the observer to the video player container if available.
    // If no container is found, skip observation entirely — the SPA
    // navigation listener will retry on the next page transition.
    const targetNode = findWatchContainer();

    if (!targetNode) return;

    observer = new MutationObserver(() => {
      // Bail out if we were disconnected while mutations were in-flight.
      if (watchState !== WatchState.WATCHING) return;

      if (debounceTimer !== null) return;
      debounceTimer = window.setTimeout(() => {
        debounceTimer = null;
        tryChangeLanguage();
      }, CHECK_DEBOUNCE_MS);
    });

    observer.observe(targetNode, { childList: true, subtree: true });

    // Timeout auto-stops watching if the language form never appears.
    // stopWatching() is already idempotent via null checks, so no guard needed.
    observeTimeout = window.setTimeout(stopWatching, OBSERVE_TIMEOUT_MS);
  }

  function run(): void {
    // stopWatching() is idempotent — safe to call whether or not we have an observer.
    stopWatching();
    if (tryChangeLanguage()) return;
    watchForLanguageForm();
  }

  // SPA navigation detection — three layered mechanisms for maximum
  // cross-environment compatibility:
  //
  // 1. `popstate` event — covers back/forward browser navigation,
  //    required for all browsers without the Navigation API.
  // 2. Navigation API (`navigation.navigate` event) — modern standard
  //    for SPA route changes, enabled in `startNavObserver()`.
  //    NOTE: Navigation API is Chromium-only (Chrome 105+, Edge 105+).
  //    Firefox and Safari do not support it. In those browsers the
  //    narrow-scope MutationObserver fallback (mechanism 3) handles SPA
  //    transitions instead.
  // 3. MutationObserver (in `startNavObserver()`) — narrow-scope observer
  //    on a page-container element. Catches SPA content replacement in
  //    browsers without Navigation API (Firefox, Safari).
  //
  // All three funnel through the debounced `checkNavigation()`, so only
  // one `run()` call occurs per navigation event.
  let lastLocation = window.location.href;
  let navDebounceTimer: ReturnType<typeof window.setTimeout> | null = null;

  function checkNavigation(): void {
    if (navDebounceTimer !== null) return;
    navDebounceTimer = window.setTimeout(() => {
      navDebounceTimer = null;
      if (window.location.href !== lastLocation) {
        lastLocation = window.location.href;
        run();
      }
    }, CHECK_DEBOUNCE_MS);
  }

  /**
   * Centralised setup for all navigation and UI event detection.
   * Registers popstate, Escape key, and SPA nav observer — called on
   * both initial load and re-enable to ensure all listeners are restored
   * after stopWatching() removes them.
   */
  function startNavigationDetection(): void {
    startEscapeHandler();
    window.addEventListener('popstate', checkNavigation);
    startNavObserver();
  }

  startNavigationDetection();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run, { once: true });
  } else {
    run();
  }

  if (typeof GM_registerMenuCommand === 'function') {
    GM_registerMenuCommand('Toggle Auto Set Language', () => {
      const newValue = !isEnabled();
      setEnabled(newValue);
      toast(`Script ${newValue ? 'enabled' : 'disabled'}.`, newValue ? 'success' : 'info');
      if (newValue) {
        startNavigationDetection();
        run();
      } else {
        stopWatching();
      }
    });
  }

  /**
   * Start watching for SPA navigation events.
   *
   * BROWSER SUPPORT:
   * - Chromium (Chrome, Edge): uses the Navigation API (no DOM observer).
   * - Firefox, Safari: uses a narrow-scope MutationObserver on the page
   *   content container (never document.body). If no suitable container
   *   is found, SPA transitions in these browsers rely on the popstate
   *   handler + initial run() call instead.
   */
  function startNavObserver(): void {
    if (navObserver !== null) return;
    if (navApiRegistered) return;

    // Prefer the Navigation API when available — fires only on actual
    // navigation events without observing DOM mutations site-wide.
    if (typeof navigation !== 'undefined' && typeof navigation.addEventListener === 'function') {
      navigation.addEventListener('navigate', checkNavigation);
      navApiRegistered = true;
      return;
    }

    // Fallback: narrow-scope MutationObserver on a page container.
    // NEVER fall back to document.body — its subtree fires hundreds of
    // times per second on content-heavy NicoNico pages (live comments,
    // ads, sidebar), causing severe performance degradation.
    const navTarget = findNavContainer();

    if (navTarget) {
      navObserver = new MutationObserver(() => checkNavigation());
      navObserver.observe(navTarget, { childList: true, subtree: true });
    } else {
      // No suitable container found — skip the observer. The popstate
      // handler and initial run() call still cover back/forward navigation
      // and the initial page load. SPA transitions in Firefox/Safari on
      // non-standard page layouts may not auto-trigger language detection.
      Logger.debug(
        'No container found for nav observer; ' +
          'SPA navigation detection limited to popstate events.'
      );
    }
  }
})();
