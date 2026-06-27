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
// @grant        GM_addStyle
// ==/UserScript==

declare function GM_registerMenuCommand(name: string, callback: () => void): void;
declare function GM_setValue(name: string, value: unknown): void;
declare function GM_getValue<T>(name: string, defaultValue: T): T;
declare function GM_addStyle(css: string): void;

(() => {
  const TARGET_LANGUAGE = 'ja-jp';
  const OBSERVE_TIMEOUT_MS = 5000;
  const CHECK_DEBOUNCE_MS = 100;
  const TOAST_DURATION_MS = 2500;
  const STORAGE_KEY_ENABLED = 'nicoauto-enabled';

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
    return GM_getValue<boolean>(STORAGE_KEY_ENABLED, true);
  }

  function setEnabled(value: boolean): void {
    GM_setValue(STORAGE_KEY_ENABLED, value);
  }

  let submitted = false;
  let observer: MutationObserver | null = null;
  let observeTimeout: ReturnType<typeof window.setTimeout> | null = null;
  let debounceTimer: ReturnType<typeof window.setTimeout> | null = null;
  const activeToasts: { el: HTMLDivElement; timers: ReturnType<typeof window.setTimeout>[] }[] = [];

  function clearAllToasts(): void {
    for (const { el, timers } of activeToasts) {
      for (const id of timers) window.clearTimeout(id);
      el.remove();
    }
    activeToasts.length = 0;
  }

  function toast(message: string, type: 'success' | 'error' | 'info' = 'success'): void {
    if (!document.body) return;

    const el = document.createElement('div');
    el.textContent = message;
    el.style.cssText = TOAST_BASE_STYLE + toastBg(type);
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');

    document.body.appendChild(el);
    const timers: ReturnType<typeof window.setTimeout>[] = [];
    const fadeTimer = window.setTimeout(() => {
      el.style.transition = 'opacity 0.25s';
      el.style.opacity = '0';
      const removeTimer = window.setTimeout(() => {
        el.remove();
        const idx = activeToasts.findIndex((t) => t.el === el);
        if (idx !== -1) activeToasts.splice(idx, 1);
      }, 300);
      timers.push(removeTimer);
    }, TOAST_DURATION_MS);
    timers.push(fadeTimer);
    activeToasts.push({ el, timers });
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
    clearAllToasts();
  }

  function findLanguageForm(): { form: HTMLFormElement; input: HTMLInputElement } | null {
    const input = document.querySelector<HTMLInputElement>('form input[name="language"]');
    if (!input) return null;

    const form = input.form ?? input.closest('form');
    if (!(form instanceof HTMLFormElement)) return null;

    return { form, input };
  }

  function tryChangeLanguage(): boolean {
    if (submitted) return true;
    if (!isEnabled()) return false;

    const found = findLanguageForm();
    if (!found) return false;

    try {
      found.input.value = TARGET_LANGUAGE;
      toast('Changing language to Japanese...', 'info');

      // Set submitted BEFORE submit() to prevent retry loops.
      // If submit() throws, we reset it in the catch block.
      submitted = true;
      found.form.submit();
      stopWatching();
      return true;
    } catch (err) {
      // Reset submitted on failure so we can retry
      submitted = false;
      console.error('[NicoNico Language] Failed to submit language form:', err);
      toast('Failed to change language.', 'error');
      stopWatching();
      return false;
    }
  }

  function watchForLanguageForm(): void {
    if (observer !== null) return;

    // Scope the observer to the video player container if available,
    // falling back to documentElement only when necessary.
    const targetNode =
      document.querySelector('#watch-page-container') ??
      document.querySelector('.watch-container') ??
      document.documentElement;

    observer = new MutationObserver((mutations) => {
      // Early return: skip mutations clearly unrelated to the language form
      if (mutations.length > 0) {
        const relevant = mutations.some((m) => {
          if (m.type === 'childList') return true;
          return (
            m.target instanceof HTMLElement &&
            m.target.closest('form input[name="language"]') !== null
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
      stopWatching();
    }, OBSERVE_TIMEOUT_MS);
  }

  function run(): void {
    submitted = false;
    stopWatching(); // Always clean up previous observer before starting fresh
    if (tryChangeLanguage()) return;
    watchForLanguageForm();
  }

  // SPA navigation detection: re-run on URL changes
  let lastLocation = window.location.href;

  function checkNavigation(): void {
    if (window.location.href !== lastLocation) {
      lastLocation = window.location.href;
      run();
    }
  }

  // Listen to popstate (back/forward navigation)
  window.addEventListener('popstate', checkNavigation);

  // Listen to yt-navigate-end (Niconico SPA navigation event)
  window.addEventListener('yt-navigate-end', checkNavigation);

  // Also observe the body for SPA content replacement
  const navObserver = new MutationObserver(() => {
    checkNavigation();
  });
  navObserver.observe(document.documentElement, { childList: true, subtree: false });

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
        run();
      } else {
        stopWatching();
      }
    });
  }

  window.addEventListener('beforeunload', () => {
    stopWatching();
    navObserver.disconnect();
  });
})();
