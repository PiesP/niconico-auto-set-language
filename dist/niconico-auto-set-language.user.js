"use strict";
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
(() => {
    const STORAGE_KEY = 'settings';
    const TARGET_LANGUAGE = 'ja-jp';
    const OBSERVE_TIMEOUT_MS = 5000;
    const DEBOUNCE_MS = 100;
    const TOAST_DURATION_MS = 2500;
    let ToastType;
    (function (ToastType) {
        ToastType["Info"] = "#2196F3";
        ToastType["Success"] = "#4CAF50";
        ToastType["Error"] = "#f44336";
    })(ToastType || (ToastType = {}));
    const DEFAULT_SETTINGS = {
        enabled: true,
        showNotification: true,
        debug: false,
    };
    let settings = null;
    function getSettings() {
        if (settings === null) {
            const stored = GM_getValue(STORAGE_KEY, {});
            settings = { ...DEFAULT_SETTINGS, ...stored };
        }
        return settings;
    }
    function saveSettings() {
        GM_setValue(STORAGE_KEY, getSettings());
    }
    function debugLog(message, ...args) {
        if (getSettings().debug) {
            console.debug(`[NicoNico Language] ${message}`, ...args);
        }
    }
    function showToast(message, color) {
        if (!getSettings().showNotification || !document.body)
            return;
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
    let observer = null;
    let observeTimeoutId = null;
    let debounceTimerId = null;
    function clearTimers() {
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
    function findLanguageInput() {
        return document.querySelector('form input[name="language"]');
    }
    function tryChangeLanguage() {
        if (submitted)
            return true;
        const currentSettings = getSettings();
        if (!currentSettings.enabled)
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
            showToast('Changing language to Japanese...', ToastType.Info);
            submitted = true;
            clearTimers();
            form.requestSubmit();
            return true;
        }
        catch (err) {
            console.error('[NicoNico Language] Failed to submit language form:', err);
            showToast('Failed to change language.', ToastType.Error);
            clearTimers();
            return false;
        }
    }
    function watchForLanguageForm() {
        if (observer !== null)
            return;
        debugLog('Language form not found yet, watching for DOM changes...');
        observer = new MutationObserver(() => {
            if (debounceTimerId !== null) {
                clearTimeout(debounceTimerId);
            }
            debounceTimerId = setTimeout(() => {
                if (tryChangeLanguage())
                    clearTimers();
            }, DEBOUNCE_MS);
        });
        observer.observe(document.documentElement, { childList: true, subtree: true });
        observeTimeoutId = setTimeout(() => {
            debugLog('Timed out waiting for language form (%d ms).', OBSERVE_TIMEOUT_MS);
            clearTimers();
        }, OBSERVE_TIMEOUT_MS);
    }
    function run() {
        if (!tryChangeLanguage())
            watchForLanguageForm();
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', run, { once: true });
    }
    else {
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
        }
        else {
            clearTimers();
            showToast('Auto Set Language disabled.', ToastType.Info);
        }
    });
})();
