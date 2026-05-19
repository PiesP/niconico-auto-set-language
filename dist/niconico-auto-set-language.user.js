// ==UserScript==
// @name         NicoNico Auto Set Language
// @namespace    https://github.com/PiesP/niconico-auto-set-language
// @version      0.9.1
// @license      MIT
// @description  Automatically set language to Japanese on NicoNico.
// @match        *://*.nicovideo.jp/*
// @grant        GM_registerMenuCommand
// ==/UserScript==
(() => {
    const TARGET_LANGUAGE = 'ja-jp';
    const OBSERVE_TIMEOUT_MS = 5000;
    const CHECK_DEBOUNCE_MS = 100;
    const TOAST_DURATION_MS = 2500;
    const TOAST_BG = {
        success: '#4CAF50',
        error: '#f44336',
        info: '#2196F3',
    };
    let enabled = true;
    let submitted = false;
    let observer = null;
    let observeTimeout = null;
    let debounceTimer = null;
    function toast(message, type = 'success') {
        if (!document.body)
            return;
        const el = document.createElement('div');
        el.textContent = message;
        el.style.cssText =
            'position:fixed;top:10px;right:10px;color:#fff;padding:10px 12px;' +
                'border-radius:6px;z-index:2147483647;' +
                'font:13px/1.4 system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;' +
                `box-shadow:0 2px 10px rgba(0,0,0,.18);background:${TOAST_BG[type]}`;
        document.body.appendChild(el);
        window.setTimeout(() => {
            el.style.transition = 'opacity 0.25s';
            el.style.opacity = '0';
            window.setTimeout(() => el.remove(), 300);
        }, TOAST_DURATION_MS);
    }
    function stopWatching() {
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
    function findLanguageForm() {
        const input = document.querySelector('form input[name="language"]');
        if (!input)
            return null;
        const form = input.form ?? input.closest('form');
        if (!(form instanceof HTMLFormElement))
            return null;
        return { form, input };
    }
    function tryChangeLanguage() {
        if (submitted)
            return true;
        if (!enabled)
            return false;
        if (document.documentElement.lang === TARGET_LANGUAGE)
            return true;
        const found = findLanguageForm();
        if (!found)
            return false;
        try {
            found.input.value = TARGET_LANGUAGE;
            toast('Changing language to Japanese...', 'info');
            submitted = true;
            stopWatching();
            found.form.submit();
            return true;
        }
        catch (err) {
            console.error('[NicoNico Language] Failed to submit language form:', err);
            toast('Failed to change language.', 'error');
            stopWatching();
            return false;
        }
    }
    function watchForLanguageForm() {
        if (observer !== null)
            return;
        observer = new MutationObserver(() => {
            if (debounceTimer !== null)
                return;
            debounceTimer = window.setTimeout(() => {
                debounceTimer = null;
                if (tryChangeLanguage())
                    stopWatching();
            }, CHECK_DEBOUNCE_MS);
        });
        observer.observe(document.documentElement, { childList: true, subtree: true });
        observeTimeout = window.setTimeout(() => {
            stopWatching();
        }, OBSERVE_TIMEOUT_MS);
    }
    function run() {
        submitted = false;
        if (tryChangeLanguage())
            return;
        watchForLanguageForm();
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', run, { once: true });
    }
    else {
        run();
    }
    GM_registerMenuCommand('Toggle Auto Set Language', () => {
        enabled = !enabled;
        toast(`Script ${enabled ? 'enabled' : 'disabled'}.`, enabled ? 'success' : 'info');
        if (enabled) {
            run();
        }
        else {
            stopWatching();
        }
    });
})();
