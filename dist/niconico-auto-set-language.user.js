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
    };
    const DEFAULT_SETTINGS = {
        enabled: true,
        showNotification: true,
        debug: false,
    };
    const settings = loadSettings();
    function loadSettings() {
        const stored = GM_getValue(STORAGE_KEY, {});
        return { ...DEFAULT_SETTINGS, ...stored };
    }
    function saveSettings() {
        GM_setValue(STORAGE_KEY, settings);
    }
    // --- Logging ---
    function debugLog(message, ...args) {
        if (settings.debug) {
            console.debug(`[NicoNico Language] ${message}`, ...args);
        }
    }
    // --- Toast ---
    function showToast(message, color) {
        if (!settings.showNotification || !document.body)
            return;
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
    let observer = null;
    let observeTimeout = null;
    let debounceTimer = null;
    function clearTimers() {
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
    function findLanguageInput() {
        return document.querySelector('form input[name="language"]');
    }
    // --- Core logic ---
    function tryChangeLanguage() {
        if (submitted)
            return true;
        if (!settings.enabled)
            return false;
        if (document.documentElement.lang === TARGET_LANGUAGE) {
            debugLog('Language already set to %s, skipping.', TARGET_LANGUAGE);
            return true;
        }
        const input = findLanguageInput();
        if (!input)
            return false;
        const form = input.closest('form');
        if (!form)
            return false;
        try {
            input.value = TARGET_LANGUAGE;
            showToast('Changing language to Japanese...', TOAST_COLORS.info);
            submitted = true;
            clearTimers();
            form.requestSubmit();
            return true;
        }
        catch (err) {
            console.error('[NicoNico Language] Failed to submit language form:', err);
            showToast('Failed to change language.', TOAST_COLORS.error);
            clearTimers();
            return false;
        }
    }
    function watchForLanguageForm() {
        if (observer !== null)
            return;
        debugLog('Language form not found yet, watching for DOM changes...');
        observer = new MutationObserver(() => {
            clearTimeout(debounceTimer ?? undefined);
            debounceTimer = setTimeout(() => {
                if (tryChangeLanguage())
                    clearTimers();
            }, DEBOUNCE_MS);
        });
        observer.observe(document.documentElement, { childList: true, subtree: true });
        observeTimeout = setTimeout(() => {
            debugLog('Timed out waiting for language form (%d ms).', OBSERVE_TIMEOUT_MS);
            clearTimers();
        }, OBSERVE_TIMEOUT_MS);
    }
    function run() {
        if (!tryChangeLanguage())
            watchForLanguageForm();
    }
    // --- Entry point ---
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', run, { once: true });
    }
    else {
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
        }
        else {
            clearTimers();
            showToast('Auto Set Language disabled.', TOAST_COLORS.info);
        }
    });
})();
