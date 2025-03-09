// ==UserScript==
// @name         NicoNico Auto Set Language
// @namespace    https://github.com/PiesP/niconico-auto-set-language
// @version      0.9.0
// @description  Automatically set language to Japanese on NicoNico.
// @match        *://*.nicovideo.jp/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const userSettings = {
        enabled: true,
        showNotification: true,
        language: 'ja-jp',
        debug: false
    };
    
    function log(message) {
        if (userSettings.debug) {
            console.log(`[NicoNico Language] ${message}`);
        }
    }
    
    function isAlreadyJapanese() {
        if (document.documentElement.lang === userSettings.language) {
            log('언어가 이미 일본어로 설정되어 있습니다. 스크립트를 종료합니다.');
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
    
    function changeLanguage(languageItem, languageForm) {
        if (!languageItem || !languageForm) {
            log('언어 선택에 필요한 UI 요소를 찾을 수 없습니다. 스크립트를 종료합니다.');
            return false;
        }
        
        if (languageItem.getAttribute('data-value') === userSettings.language) {
            log('언어가 이미 일본어로 설정되어 있습니다.');
            return false;
        }
        
        try {
            const languageInput = languageForm.querySelector('input[name="language"]');
            if (languageInput) {
                log('현재 언어가 일본어가 아닙니다. 일본어로 변경합니다.');
                languageInput.value = userSettings.language;
                
                if (userSettings.showNotification) {
                    showNotification('언어를 일본어로 변경 중입니다...');
                }
                
                log('언어 양식이 업데이트되었습니다. 양식을 제출합니다.');
                languageForm.submit();
                return true;
            } else {
                log('언어 입력 필드를 찾을 수 없습니다. 스크립트를 종료합니다.');
                return false;
            }
        } catch (error) {
            console.error('[NicoNico Language] 언어 설정 변경 중 오류 발생:', error);
            return false;
        }
    }
    
    function showNotification(message, duration = 3000) {
        if (!userSettings.showNotification) return;
        
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: #4CAF50;
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
            log('스크립트가 비활성화되어 있습니다.');
            return;
        }
        
        if (isAlreadyJapanese()) return;
        
        const elements = findLanguageElements();
        if (elements.languageItem && elements.languageForm) {
            changeLanguage(elements.languageItem, elements.languageForm);
        } else {
            log('언어 선택 요소를 찾을 수 없습니다. DOM 변경 감지를 시작합니다.');
            setupMutationObserver();
        }
    }
    
    function setupMutationObserver() {
        if (window._nicoLangObserver) return;
        
        const observer = new MutationObserver((mutations) => {
            const elements = findLanguageElements();
            if (elements.languageItem && elements.languageForm) {
                if (changeLanguage(elements.languageItem, elements.languageForm)) {
                    observer.disconnect();
                    window._nicoLangObserver = null;
                }
            }
        });
        
        observer.observe(document.documentElement, {
            childList: true,
            subtree: true
        });
        
        window._nicoLangObserver = observer;
        
        setTimeout(() => {
            if (window._nicoLangObserver) {
                window._nicoLangObserver.disconnect();
                window._nicoLangObserver = null;
                log('언어 요소를 찾을 수 없습니다. 관찰이 타임아웃되었습니다.');
            }
        }, 5000);
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
    
    if (typeof GM_registerMenuCommand === 'function') {
        GM_registerMenuCommand('스크립트 활성화/비활성화', () => {
            userSettings.enabled = !userSettings.enabled;
            alert(`스크립트가 ${userSettings.enabled ? '활성화' : '비활성화'}되었습니다.`);
            if (userSettings.enabled) initialize();
        });
    }
})();
