// ==UserScript==
// @name         NicoNico Auto Set Language
// @namespace    https://github.com/PiesP/niconico-auto-set-language
// @version      0.9.1
// @license      MIT
// @description  Automatically set language to Japanese on NicoNico.
// @match        *://*.nicovideo.jp/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// ==/UserScript==

declare function GM_getValue<T>(key: string, defaultValue: T): T;
declare function GM_setValue<T>(key: string, value: T): void;
declare function GM_registerMenuCommand(name: string, callback: () => void): void;

(() => {
  // --- Constants ---
  const STORAGE_KEY = 'settings';
  const TARGET_LANGUAGE = 'ja-jp';
  const OBSERVE_TIMEOUT_MS = 5000;
  const DEBOUNCE_MS = 100;
  const TOAST_DURATION_MS = 2500;

  const TOAST_COLORS = {
    info: '#2196F3',
    success: '#4CAF50',
    error: '#f44336',
  } as const;

  type ToastColor = (typeof TOAST_COLORS)[keyof typeof TOAST_COLORS];

  // --- Settings ---
  interface Settings {
    enabled: boolean;
    showNotification: boolean;
    debug: boolean;
  }

  const DEFAULT_SETTINGS: Settings = {
    enabled: true,
    showNotification: true,
    debug: false,
  };

  const settings: Settings = loadSettings();

  function loadSettings(): Settings {
    const stored = GM_getValue<Partial<Settings>>(STORAGE_KEY, {});
    return { ...DEFAULT_SETTINGS, ...stored };
  }

  function saveSettings(): void {
    GM_setValue(STORAGE_KEY, settings);
  }

  // --- Logging ---
  function debugLog(message: string, ...args: unknown[]): void {
    if (settings.debug) {
      console.debug(`[NicoNico Language] ${message}`, ...args);
    }
  }

  // --- Toast ---
  function showToast(message: string, color: ToastColor): void {
    if (!settings.showNotification || !document.body) return;

    const el = document.createElement('div');
    el.textContent = message;
    el.style.cssText =
      'position:fixed;top:10px;right:10px;color:#fff;padding:10px 12px;' +
      'border-radius:6px;z-index:2147483647;' +
      'font:13px/1.4 system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;' +
      `box-shadow:0 2px 10px rgba(0,0,0,.18);background:${color}`;

    document.body.appendChild(el);

    setTimeout(() => {
      el.style.transition = 'opacity 0.25s';
      el.style.opacity = '0';
      setTimeout(() => el.remove(), 300);
    }, TOAST_DURATION_MS);
  }

  // --- State ---
  let submitted = false;
  let observer: MutationObserver | null = null;
  let observeTimeout: ReturnType<typeof setTimeout> | null = null;
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  function clearTimers(): void {
    if (debounceTimer !== null) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
    if (observeTimeout !== null) {
      clearTimeout(observeTimeout);
      observeTimeout = null;
    }
    if (observer !== null) {
      observer.disconnect();
      observer = null;
    }
  }

  // --- DOM helpers ---
  function findLanguageInput(): HTMLInputElement | null {
    return document.querySelector<HTMLInputElement>('form input[name="language"]');
  }

  // --- Core logic ---
  function tryChangeLanguage(): boolean {
    if (submitted) return true;
    if (!settings.enabled) return false;

    if (document.documentElement.lang === TARGET_LANGUAGE) {
      debugLog('Language already set to %s, skipping.', TARGET_LANGUAGE);
      return true;
    }

    const input = findLanguageInput();
    if (!input) return false;

    const form = input.closest('form');
    if (!form) return false;

    try {
      input.value = TARGET_LANGUAGE;
      showToast('Changing language to Japanese...', TOAST_COLORS.info);
      submitted = true;
      clearTimers();
      form.requestSubmit();
      return true;
    } catch (err) {
      console.error('[NicoNico Language] Failed to submit language form:', err);
      showToast('Failed to change language.', TOAST_COLORS.error);
      clearTimers();
      return false;
    }
  }

  function watchForLanguageForm(): void {
    if (observer !== null) return;

    debugLog('Language form not found yet, watching for DOM changes...');

    observer = new MutationObserver(() => {
      clearTimeout(debounceTimer ?? undefined);
      debounceTimer = setTimeout(() => {
        if (tryChangeLanguage()) clearTimers();
      }, DEBOUNCE_MS);
    });

    observer.observe(document.documentElement, { childList: true, subtree: true });

    observeTimeout = setTimeout(() => {
      debugLog('Timed out waiting for language form (%d ms).', OBSERVE_TIMEOUT_MS);
      clearTimers();
    }, OBSERVE_TIMEOUT_MS);
  }

  function run(): void {
    if (!tryChangeLanguage()) watchForLanguageForm();
  }

  // --- Entry point ---
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run, { once: true });
  } else {
    run();
  }

  // --- Menu command ---
  GM_registerMenuCommand('Toggle Auto Set Language', () => {
    settings.enabled = !settings.enabled;
    saveSettings();

    if (settings.enabled) {
      submitted = false;
      showToast('Auto Set Language enabled.', TOAST_COLORS.success);
      run();
    } else {
      clearTimers();
      showToast('Auto Set Language disabled.', TOAST_COLORS.info);
    }
  });
})();
