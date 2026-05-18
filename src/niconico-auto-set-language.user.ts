// ==UserScript==
// @name         NicoNico Auto Set Language
// @namespace    https://github.com/PiesP/niconico-auto-set-language
// @version      0.9.1
// @license      MIT
// @description  Automatically set language to Japanese on NicoNico.
// @match        *://www.nicovideo.jp/*
// @match        *://nicovideo.jp/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// ==/UserScript==

declare function GM_getValue<T>(key: string, defaultValue: T): T;
declare function GM_setValue<T>(key: string, value: T): void;
declare function GM_registerMenuCommand(name: string, callback: () => void): void;

(() => {
  const STORAGE_KEY = 'settings';
  const TARGET_LANGUAGE = 'ja-jp';
  const OBSERVE_TIMEOUT_MS = 5000;
  const DEBOUNCE_MS = 100;
  const TOAST_DURATION_MS = 2500;

  enum ToastType {
    Info = '#2196F3',
    Success = '#4CAF50',
    Error = '#f44336',
  }

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

  let settings: Settings | null = null;

  function getSettings(): Settings {
    if (settings === null) {
      const stored = GM_getValue<Partial<Settings>>(STORAGE_KEY, {});
      settings = { ...DEFAULT_SETTINGS, ...stored };
    }
    return settings;
  }

  function saveSettings(): void {
    GM_setValue(STORAGE_KEY, getSettings());
  }

  function debugLog(message: string, ...args: unknown[]): void {
    if (getSettings().debug) {
      console.debug(`[NicoNico Language] ${message}`, ...args);
    }
  }

  function showToast(message: string, color: ToastType): void {
    if (!getSettings().showNotification || !document.body) return;

    const el = document.createElement('div');
    el.textContent = message;
    el.style.cssText = `position:fixed;top:10px;right:10px;color:#fff;padding:10px 12px;border-radius:6px;z-index:2147483647;font:13px/1.4 system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;box-shadow:0 2px 10px rgba(0,0,0,.18);background:${color}`;

    document.body.appendChild(el);

    setTimeout(() => {
      el.style.transition = 'opacity 0.25s';
      el.style.opacity = '0';
      setTimeout(() => {
        el.remove();
      }, 300);
    }, TOAST_DURATION_MS);
  }

  let submitted = false;
  let observer: MutationObserver | null = null;
  let observeTimeoutId: ReturnType<typeof setTimeout> | null = null;
  let debounceTimerId: ReturnType<typeof setTimeout> | null = null;

  function clearTimers(): void {
    if (debounceTimerId !== null) {
      clearTimeout(debounceTimerId);
      debounceTimerId = null;
    }
    if (observeTimeoutId !== null) {
      clearTimeout(observeTimeoutId);
      observeTimeoutId = null;
    }
    if (observer !== null) {
      observer.disconnect();
      observer = null;
    }
  }

  function findLanguageInput(): HTMLInputElement | null {
    return document.querySelector<HTMLInputElement>('form input[name="language"]');
  }

  function tryChangeLanguage(): boolean {
    if (submitted) return true;

    const currentSettings = getSettings();
    if (!currentSettings.enabled) return false;

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
      showToast('Changing language to Japanese...', ToastType.Info);
      submitted = true;
      clearTimers();
      form.requestSubmit();
      return true;
    } catch (err) {
      console.error('[NicoNico Language] Failed to submit language form:', err);
      showToast('Failed to change language.', ToastType.Error);
      clearTimers();
      return false;
    }
  }

  function watchForLanguageForm(): void {
    if (observer !== null) return;

    debugLog('Language form not found yet, watching for DOM changes...');

    observer = new MutationObserver(() => {
      if (debounceTimerId !== null) {
        clearTimeout(debounceTimerId);
      }
      debounceTimerId = setTimeout(() => {
        if (tryChangeLanguage()) clearTimers();
      }, DEBOUNCE_MS);
    });

    observer.observe(document.documentElement, { childList: true, subtree: true });

    observeTimeoutId = setTimeout(() => {
      debugLog('Timed out waiting for language form (%d ms).', OBSERVE_TIMEOUT_MS);
      clearTimers();
    }, OBSERVE_TIMEOUT_MS);
  }

  function run(): void {
    if (!tryChangeLanguage()) watchForLanguageForm();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run, { once: true });
  } else {
    run();
  }

  GM_registerMenuCommand('Toggle Auto Set Language', () => {
    const s = getSettings();
    s.enabled = !s.enabled;
    saveSettings();

    if (s.enabled) {
      submitted = false;
      clearTimers();
      showToast('Auto Set Language enabled.', ToastType.Success);
      run();
    } else {
      clearTimers();
      showToast('Auto Set Language disabled.', ToastType.Info);
    }
  });
})();
