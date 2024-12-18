// ==UserScript==
// @name         NicoNico Auto Set Language
// @namespace    https://greasyfork.org/users/1412359-piesp
// @version      1.2
// @description  Automatically set language to Japanese on NicoNico.
// @author       PiesP
// @license      MIT
// @match        *://*.nicovideo.jp/*
// @grant        none
// @supportURL   https://greasyfork.org/users/1412359-piesp
// @downloadURL https://update.greasyfork.org/scripts/521079/NicoNico%20Auto%20Set%20Language.user.js
// @updateURL https://update.greasyfork.org/scripts/521079/NicoNico%20Auto%20Set%20Language.meta.js
// ==/UserScript==

(function() {
    'use strict';

    // Check if the current page is already in Japanese
    if (document.documentElement.lang === 'ja-jp') {
        console.log('The language is already set to Japanese. Exiting script.');
        return; // Exit script
    }

    // Find the necessary UI elements
    const languageItem = document.querySelector('.CountrySelector-currentItem');
    const languageForm = document.querySelector('.CountrySelector-form');

    if (!languageItem || !languageForm) {
        console.log('Required UI elements for language selection are not found. Exiting script.');
        return; // Exit if elements are not found
    }

    // Check the current language setting
    if (languageItem.getAttribute('data-value') !== 'ja-jp') {
        console.log('The current language is not Japanese. Changing it to Japanese.');

        // Modify the form data to set the language to Japanese
        const languageInput = languageForm.querySelector('input[name="language"]');
        if (languageInput) {
            languageInput.value = 'ja-jp';
            console.log('Language form updated. Submitting the form.');
            languageForm.submit(); // Submit the form
        } else {
            console.log('Language input field not found. Exiting script.');
        }
    } else {
        console.log('The language is already set to Japanese.');
    }
})();
