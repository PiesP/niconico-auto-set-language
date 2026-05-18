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
  const STORAGE_KEY = 'settings';
  const TARGET_LANGUAGE = 'ja-jp';
  const OBSERVE_TIMEOUT_MS = 5000;
  const DEBOUNCE_MS = 100;
  const TOAST_DURATION_MS = 2500;

  type Settings = {
    enabled: boolean;
    showNotification: boolean;
    debug: boolean;
  };

  const DEFAULT_SETTINGS: Settings = {
    enabled: true,
    showNotification: true,
    debug: false,
  };

  const TOAST_COLORS = {
    success: '#4CAF50',
    error: '#f44336',
    info: '#2196F3',
  } as const;

  type ToastType = keyof typeof TOAST_COLORS;

  const settings = loadSettings();
  let observer: MutationObserver | null = null;
  let observeTimeout: number | null = null;
  let debounceTimer: number | null = null;
  let submitted = false;

  function loadSettings(): Settings {
    const raw = GM_getValue<unknown>(STORAGE_KEY, {});
    const obj = typeof raw === 'object' && raw !== null ? (raw as Partial<Settings>) : {};
    return {
      enabled: obj.enabled ?? DEFAULT_SETTINGS.enabled,
      showNotification: obj.showNotification ?? DEFAULT_SETTINGS.showNotification,
      debug: obj.debug ?? DEFAULT_SETTINGS.debug,
    };
  }

  function saveSettings(): void {
    GM_setValue(STORAGE_KEY, settings);
  }

  function debugLog(message: string, ...args: unknown[]): void {
    if (settings.debug) {
      console.debug(`[NicoNico Language] ${message}`, ...args);
    }
  }

  function toast(message: string, type: ToastType = 'success'): void {
    if (!settings.showNotification || !document.body) return;

    const el = document.createElement('div');
    el.textContent = message;
    el.style.cssText = [
      'position: fixed',
      'top: 10px',
      'right: 10px',
      'color: #fff',
      'padding: 10px 12px',
      'border-radius: 6px',
      'z-index: 2147483647',
      'font: 13px/1.4 system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif',
      'box-shadow: 0 2px 10px rgba(0,0,0,.18)',
      `background: ${TOAST_COLORS[type]}`,
    ].join(';');

    document.body.appendChild(el);
    window.setTimeout(() => {
      el.style.transition = 'opacity 0.25s';
      el.style.opacity = '0';
      window.setTimeout(() => el.remove(), 300);
    }, TOAST_DURATION_MS);
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
  }

  function findLanguageForm(): { form: HTMLFormElement; input: HTMLInputElement } | null {
    const input = document.querySelector<HTMLInputElement>('form input[name="language"]');
    if (!input) return null;

    const form = input.closest('form');
    if (!(form instanceof HTMLFormElement)) return null;

    return { form, input };
  }

  function tryChangeLanguage(): boolean {
    if (submitted) return true;
    if (!settings.enabled) return false;

    if (document.documentElement.lang === TARGET_LANGUAGE) {
      debugLog('Language already set to %s.', TARGET_LANGUAGE);
      return true;
    }

    const found = findLanguageForm();
    if (!found) return false;

    try {
      found.input.value = TARGET_LANGUAGE;
      toast('Changing language to Japanese...', 'info');
      submitted = true;
      stopWatching();
      found.form.submit();
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
      if (debounceTimer !== null) {
        window.clearTimeout(debounceTimer);
      }
      debounceTimer = window.setTimeout(() => {
        debounceTimer = null;
        if (tryChangeLanguage()) stopWatching();
      }, DEBOUNCE_MS);
    });

    observer.observe(document.documentElement, { childList: true, subtree: true });

    observeTimeout = window.setTimeout(() => {
      debugLog('Language form not found within timeout.');
      stopWatching();
    }, OBSERVE_TIMEOUT_MS);
  }

  function run(): void {
    if (tryChangeLanguage()) return;
    watchForLanguageForm();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run, { once: true });
  } else {
    run();
  }

  GM_registerMenuCommand('Toggle Auto Set Language', () => {
    settings.enabled = !settings.enabled;
    saveSettings();
    toast(
      `Script ${settings.enabled ? 'enabled' : 'disabled'}.`,
      settings.enabled ? 'success' : 'info'
    );
    if (settings.enabled) {
      submitted = false;
      run();
    } else {
      stopWatching();
    }
  });
})();
