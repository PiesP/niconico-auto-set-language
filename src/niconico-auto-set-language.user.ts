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
// ==/UserScript==

declare function GM_registerMenuCommand(name: string, callback: () => void): void;
declare function GM_setValue(name: string, value: unknown): void;
declare function GM_getValue<T>(name: string, defaultValue: T): T;

(() => {
  const TARGET_LANGUAGE = 'ja-jp';
  const OBSERVE_TIMEOUT_MS = 5000;
  const CHECK_DEBOUNCE_MS = 100;
  const TOAST_DURATION_MS = 2500;
  const STORAGE_KEY_ENABLED = 'nicoauto-enabled';

  // Centralized DOM selectors — update these if NicoNico changes its markup.
  const SELECTOR_LANGUAGE_INPUT = 'form input[name="language"]';
  const SELECTOR_WATCH_PAGE_CONTAINER = '#watch-page-container';
  const SELECTOR_WATCH_CONTAINER = '.watch-container';

  const TOAST_BASE_STYLE =
    'position:fixed;top:10px;right:10px;color:#fff;padding:10px 12px;border-radius:6px;z-index:2147483647;font:13px/1.4 system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;box-shadow:0 2px 10px rgba(0,0,0,.18);background:';

  function toastBg(type: 'success' | 'error' | 'info'): string {
    const map: Record<'success' | 'error' | 'info', string> = {
      error: '#f44336',
      info: '#2196F3',
      success: '#4CAF50',
    };
    return map[type];
  }

  // SSOT: GM storage is the single source of truth for enabled state
  function isEnabled(): boolean {
    if (typeof GM_getValue !== 'function') return true;
    return GM_getValue<boolean>(STORAGE_KEY_ENABLED, true);
  }

  function setEnabled(value: boolean): void {
    if (typeof GM_setValue !== 'function') return;
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
  const activeToasts: { el: HTMLDivElement; timers: ReturnType<typeof window.setTimeout>[] }[] = [];

  function toast(message: string, type: 'success' | 'error' | 'info' = 'success'): void {
    if (!document.body) return;

    const el = document.createElement('div');
    el.textContent = message;
    el.style.cssText = TOAST_BASE_STYLE + toastBg(type);
    el.setAttribute('role', 'alert');
    el.setAttribute('aria-live', 'assertive');
    el.setAttribute('tabindex', '0');

    // Allow keyboard dismiss: clicking or focusing + Escape removes the toast.
    el.addEventListener('click', () => {
      removeToast(el);
    });

    document.body.appendChild(el);
    const timers: ReturnType<typeof window.setTimeout>[] = [];
    const fadeTimer = window.setTimeout(() => {
      el.style.transition = 'opacity 0.25s';
      el.style.opacity = '0';
      const removeTimer = window.setTimeout(() => {
        removeToast(el);
      }, 300);
      timers.push(removeTimer);
    }, TOAST_DURATION_MS);
    timers.push(fadeTimer);
    activeToasts.push({ el, timers });
  }

  function removeToast(el: HTMLDivElement): void {
    const idx = activeToasts.findIndex((t) => t.el === el);
    if (idx !== -1) {
      const entry = activeToasts[idx]!;
      for (const id of entry.timers) window.clearTimeout(id);
      activeToasts.splice(idx, 1);
    }
    el.remove();
  }

  function clearAllToasts(): void {
    for (const { el } of activeToasts) {
      el.remove();
    }
    activeToasts.length = 0;
  }

  // Global Escape key handler to dismiss all active toasts.
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') clearAllToasts();
  });

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
    watchState = WatchState.IDLE;
    clearAllToasts();
  }

  /**
   * Locate the language form. Try multiple selector strategies to stay
   * resilient against minor DOM restructuring on NicoNico's side.
   */
  function findLanguageForm(): { form: HTMLFormElement; input: HTMLInputElement } | null {
    // Strategy 1: input with name="language" inside a form (original approach)
    const input = document.querySelector<HTMLInputElement>(SELECTOR_LANGUAGE_INPUT);
    if (input) {
      const form = input.form ?? input.closest('form');
      if (form instanceof HTMLFormElement) return { form, input };
    }

    // Strategy 2: any form that has an input with "lang" in the name or a language testid
    const fallbackInput = document.querySelector<HTMLInputElement>(
      'input[name="lang"],[data-testid="language-select"]'
    );
    if (fallbackInput) {
      const form = fallbackInput.closest('form');
      if (form instanceof HTMLFormElement) {
        return { form, input: fallbackInput };
      }
    }

    return null;
  }

  /**
   * Validate that a form's action URL is safe to submit — must be same-origin
   * or match *.nicovideo.jp to prevent credential leakage to third parties.
   */
  function isFormActionSafe(form: HTMLFormElement): boolean {
    const action = form.action;
    if (!action) return true; // No action means current page (same-origin)
    try {
      const url = new URL(action, window.location.origin);
      if (url.origin === window.location.origin) return true;
      return url.hostname.endsWith('.nicovideo.jp');
    } catch {
      return false; // Invalid URL — reject
    }
  }

  function tryChangeLanguage(): boolean {
    if (watchState === WatchState.SUBMITTED) return true;
    if (!isEnabled()) return false;

    const found = findLanguageForm();
    if (!found) return false;

    if (!isFormActionSafe(found.form)) {
      console.warn(
        '[NicoNico Language] Skipping form submission: action URL is not safe:',
        found.form.action
      );
      return false;
    }

    try {
      found.input.value = TARGET_LANGUAGE;
      toast('Changing language to Japanese...', 'info');

      // Set state to SUBMITTED BEFORE submit() to prevent retry loops.
      // If submit() throws, we reset it in the catch block.
      watchState = WatchState.SUBMITTED;
      found.form.submit();
      stopWatching();
      return true;
    } catch (err) {
      // Reset state on failure so we can retry
      watchState = WatchState.WATCHING;
      console.error('[NicoNico Language] Failed to submit language form:', err);
      toast('Failed to change language.', 'error');
      stopWatching();
      return false;
    }
  }

  function watchForLanguageForm(): void {
    if (watchState === WatchState.WATCHING) return;
    watchState = WatchState.WATCHING;

    // Scope the observer to the video player container if available,
    // falling back to document.body only when necessary.
    // Never use documentElement to avoid observing all DOM changes.
    const targetNode =
      document.querySelector(SELECTOR_WATCH_PAGE_CONTAINER) ??
      document.querySelector(SELECTOR_WATCH_CONTAINER) ??
      document.body;

    if (!targetNode) return;

    observer = new MutationObserver((mutations) => {
      // Bail out if we were disconnected while mutations were in-flight.
      if (watchState !== WatchState.WATCHING) return;

      // Early return: skip mutations clearly unrelated to the language form
      if (mutations.length > 0) {
        const relevant = mutations.some((m) => {
          if (m.type === 'childList') return true;
          return (
            m.target instanceof HTMLElement && m.target.closest(SELECTOR_LANGUAGE_INPUT) !== null
          );
        });
        if (!relevant) return;
      }

      if (debounceTimer !== null) return;
      debounceTimer = window.setTimeout(() => {
        debounceTimer = null;
        tryChangeLanguage();
      }, CHECK_DEBOUNCE_MS);
    });

    observer.observe(targetNode, { childList: true, subtree: true });

    observeTimeout = window.setTimeout(() => {
      // Guard: stopWatching() may have already been called by tryChangeLanguage
      // or the timeout itself being cleared — only proceed if we're still watching.
      if (watchState === WatchState.WATCHING) {
        stopWatching();
      }
    }, OBSERVE_TIMEOUT_MS);
  }

  function run(): void {
    watchState = WatchState.IDLE;
    // stopWatching() is idempotent — safe to call whether or not we have an observer.
    stopWatching();
    if (tryChangeLanguage()) return;
    watchForLanguageForm();
  }

  // SPA navigation detection: re-run on URL changes
  let lastLocation = window.location.pathname;
  let navDebounceTimer: ReturnType<typeof window.setTimeout> | null = null;

  function checkNavigation(): void {
    if (navDebounceTimer !== null) return;
    navDebounceTimer = window.setTimeout(() => {
      navDebounceTimer = null;
      if (window.location.pathname !== lastLocation) {
        lastLocation = window.location.pathname;
        run();
      }
    }, CHECK_DEBOUNCE_MS);
  }

  // Listen to popstate (back/forward navigation)
  window.addEventListener('popstate', checkNavigation);

  // Also observe for SPA content replacement (narrow scope to body)
  startNavObserver();

  // Initial run
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
        startNavObserver();
        run();
      } else {
        stopWatching();
      }
    });
  }

  window.addEventListener('beforeunload', () => {
    stopWatching();
    window.removeEventListener('popstate', checkNavigation);
    if (typeof navigation !== 'undefined' && typeof navigation.removeEventListener === 'function') {
      navigation.removeEventListener('navigate', checkNavigation);
    }
  });

  function startNavObserver(): void {
    if (navObserver !== null) return;

    // Prefer the Navigation API when available — fires only on actual
    // navigation events without observing DOM mutations site-wide.
    if (typeof navigation !== 'undefined' && typeof navigation.addEventListener === 'function') {
      navigation.addEventListener('navigate', checkNavigation);
      return;
    }

    // Fallback: narrow-scope MutationObserver on the watch container.
    const navTarget =
      document.querySelector(SELECTOR_WATCH_PAGE_CONTAINER) ??
      document.querySelector(SELECTOR_WATCH_CONTAINER) ??
      document.body;

    navObserver = new MutationObserver(() => {
      checkNavigation();
    });
    if (navTarget) {
      navObserver.observe(navTarget, { childList: true, subtree: true });
    } else {
      document.addEventListener(
        'DOMContentLoaded',
        () => {
          if (navObserver) {
            const lateTarget =
              document.querySelector(SELECTOR_WATCH_PAGE_CONTAINER) ??
              document.querySelector(SELECTOR_WATCH_CONTAINER) ??
              document.body;
            if (lateTarget) navObserver.observe(lateTarget, { childList: true, subtree: true });
          }
        },
        { once: true }
      );
    }
  }
})();
