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
// ==/UserScript==

declare function GM_registerMenuCommand(name: string, callback: () => void): void;

(() => {
  const TARGET_LANGUAGE = 'ja-jp';
  const OBSERVE_TIMEOUT_MS = 5000;
  const CHECK_DEBOUNCE_MS = 100;
  const TOAST_DURATION_MS = 2500;

  const TOAST_BASE_STYLE =
    'position:fixed;top:10px;right:10px;color:#fff;padding:10px 12px;border-radius:6px;z-index:2147483647;font:13px/1.4 system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;box-shadow:0 2px 10px rgba(0,0,0,.18);background:';

  function toastBg(type: 'success' | 'error' | 'info'): string {
    if (type === 'error') return '#f44336';
    if (type === 'info') return '#2196F3';
    return '#4CAF50';
  }

  let enabled = true;
  let submitted = false;
  let observer: MutationObserver | null = null;
  let observeTimeout: number | null = null;
  let debounceTimer: number | null = null;
  const activeToasts: { el: HTMLDivElement; timers: number[] }[] = [];

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

    document.body.appendChild(el);
    const timers: number[] = [];
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
    if (!enabled) return false;

    const found = findLanguageForm();
    if (!found) return false;

    try {
      found.input.value = TARGET_LANGUAGE;
      toast('Changing language to Japanese...', 'info');
      stopWatching();
      found.form.submit();
      submitted = true;
      return true;
    } catch (err) {
      console.error('[NicoNico Language] Failed to submit language form:', err);
      toast('Failed to change language.', 'error');
      stopWatching();
      return false;
    }
  }

  function watchForLanguageForm(): void {
    if (observer !== null) return;

    observer = new MutationObserver(() => {
      if (debounceTimer !== null) return;
      debounceTimer = window.setTimeout(() => {
        debounceTimer = null;
        tryChangeLanguage();
      }, CHECK_DEBOUNCE_MS);
    });

    observer.observe(document.documentElement, { childList: true, subtree: true });

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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run, { once: true });
  } else {
    run();
  }

  if (typeof GM_registerMenuCommand === 'function') {
    GM_registerMenuCommand('Toggle Auto Set Language', () => {
      enabled = !enabled;
      toast(`Script ${enabled ? 'enabled' : 'disabled'}.`, enabled ? 'success' : 'info');
      if (enabled) {
        run();
      } else {
        stopWatching();
      }
    });
  }

  window.addEventListener('beforeunload', () => {
    clearAllToasts();
  });
})();
