// ==UserScript==
// @name         NicoNico Auto Set Language
// @namespace    https://github.com/PiesP/niconico-auto-set-language
// @version      0.9.1
// @description  Automatically set language to Japanese on NicoNico.
// @match        *://*.nicovideo.jp/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// ==/UserScript==

(function() {
    'use strict';

    const DEFAULT_SETTINGS = {
        enabled: true,
        showNotification: true,
        language: 'ja-jp',
        debug: false
    };

    function validateSettings(settings) {
        return {
            enabled: typeof settings.enabled === 'boolean' ? settings.enabled : DEFAULT_SETTINGS.enabled,
            showNotification: typeof settings.showNotification === 'boolean' ? settings.showNotification : DEFAULT_SETTINGS.showNotification,
            language: typeof settings.language === 'string' ? settings.language : DEFAULT_SETTINGS.language,
            debug: typeof settings.debug === 'boolean' ? settings.debug : DEFAULT_SETTINGS.debug
        };
    }

    const userSettings = validateSettings(GM_getValue('settings', {}));
    
    function saveSettings() {
        GM_setValue('settings', userSettings);
    }
    
    function log(message) {
        if (userSettings.debug) {
            console.log(`[NicoNico Language] ${message}`);
        }
    }
    
    function isAlreadyJapanese() {
        if (document.documentElement.lang === userSettings.language) {
            log('Language is already set to Japanese. Exiting script.');
            return true;
        }
        return false;
    }
    
    function findLanguageElements() {
        let languageItem = document.querySelector('.CountrySelector-currentItem');
        let languageForm = document.querySelector('.CountrySelector-form');
        
        if (!languageItem || !languageForm) {
            const allSelectors = [
                '.country-selector',
                '[data-language-selector]',
                'form[action*="language"]',
                'form[action*="lang"]'
            ];
            
            for (const selector of allSelectors) {
                const element = document.querySelector(selector);
                if (element) {
                    if (element.tagName === 'FORM') {
                        languageForm = element;
                    } else {
                        const nearestForm = element.closest('form');
                        if (nearestForm) languageForm = nearestForm;
                    }
                    
                    languageItem = element.querySelector('[data-value]') ||
                                   document.querySelector('[data-value]');
                    
                    if (languageForm && languageItem) break;
                }
            }
        }
        
        return { languageItem, languageForm };
    }

    function handleError(error, message) {
        console.error(`[NicoNico Language] ${message}:`, error);
        if (userSettings.showNotification) {
            showNotification(`Error: ${message}`, 5000, 'error');
        }
    }

    function changeLanguage(languageItem, languageForm) {
        if (!languageItem?.getAttribute || !languageForm?.querySelector) {
            log('Could not find UI elements required for language selection.');
            return false;
        }
        
        try {
            const languageInput = languageForm.querySelector('input[name="language"]');
            if (!languageInput) {
                throw new Error('Language input field not found.');
            }

            if (languageItem.getAttribute('data-value') === userSettings.language) {
                log('Language is already set to Japanese.');
                return false;
            }

            languageInput.value = userSettings.language;
            
            if (userSettings.showNotification) {
                showNotification('Changing language to Japanese...');
            }
            
            languageForm.submit();
            return true;
        } catch (error) {
            handleError(error, 'Error occurred while changing language settings');
            return false;
        }
    }
    
    function showNotification(message, duration = 3000, type = 'success') {
        if (!userSettings.showNotification) return;
        
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: ${type === 'error' ? '#f44336' : '#4CAF50'};
            color: white;
            padding: 10px;
            border-radius: 5px;
            z-index: 9999;
            font-family: Arial, sans-serif;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        `;
        
        document.body.appendChild(notification);
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transition = 'opacity 0.5s';
            setTimeout(() => notification.remove(), 500);
        }, duration);
    }
    
    function initialize() {
        if (!userSettings.enabled) {
            log('Script is disabled.');
            return;
        }
        
        if (isAlreadyJapanese()) return;
        
        const elements = findLanguageElements();
        if (elements.languageItem && elements.languageForm) {
            changeLanguage(elements.languageItem, elements.languageForm);
        } else {
            log('Language selection elements not found. Starting DOM change detection.');
            setupMutationObserver();
        }
    }
    
    function setupMutationObserver() {
        if (window._nicoLangObserver) return;
        
        const observer = new MutationObserver((mutations) => {
            if (window._nicoLangCheckTimeout) return;
            
            window._nicoLangCheckTimeout = setTimeout(() => {
                const elements = findLanguageElements();
                if (elements.languageItem && elements.languageForm) {
                    if (changeLanguage(elements.languageItem, elements.languageForm)) {
                        cleanupObserver();
                    }
                }
                window._nicoLangCheckTimeout = null;
            }, 100);
        });
        
        observer.observe(document.documentElement, {
            childList: true,
            subtree: true,
            attributes: false,
            characterData: false
        });
        
        window._nicoLangObserver = observer;
        
        window._nicoLangTimeout = setTimeout(() => {
            cleanupObserver();
            log('Language elements not found. Observation timed out.');
        }, 5000);
    }

    function cleanup() {
        cleanupObserver();
        if (window._nicoLangCheckTimeout) {
            clearTimeout(window._nicoLangCheckTimeout);
            delete window._nicoLangCheckTimeout;
        }
        window.removeEventListener('unload', cleanup);
        delete window._nicoLangObserver;
        delete window._nicoLangTimeout;
    }

    function cleanupObserver() {
        if (window._nicoLangCheckTimeout) {
            clearTimeout(window._nicoLangCheckTimeout);
            window._nicoLangCheckTimeout = null;
        }
        if (window._nicoLangObserver) {
            window._nicoLangObserver.disconnect();
            window._nicoLangObserver = null;
        }
        if (window._nicoLangTimeout) {
            clearTimeout(window._nicoLangTimeout);
            window._nicoLangTimeout = null;
        }
    }

    window.addEventListener('unload', cleanup);
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
    
    if (typeof GM_registerMenuCommand === 'function') {
        GM_registerMenuCommand('Toggle Script', () => {
            userSettings.enabled = !userSettings.enabled;
            saveSettings();
            showNotification(`Script has been ${userSettings.enabled ? 'enabled' : 'disabled'}.`);
            if (userSettings.enabled) initialize();
        });
    }
})();
