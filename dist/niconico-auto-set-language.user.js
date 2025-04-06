!function(){"use strict";const e=!0,n=!0,o="ja-jp",t=!1;const a={enabled:"boolean"==typeof(i=GM_getValue("settings",{})).enabled?i.enabled:e,showNotification:"boolean"==typeof i.showNotification?i.showNotification:n,language:"string"==typeof i.language?i.language:o,debug:"boolean"==typeof i.debug?i.debug:t};var i;function r(e){a.debug&&console.log(`[NicoNico Language] ${e}`)}function u(){let e=document.querySelector(".CountrySelector-currentItem"),n=document.querySelector(".CountrySelector-form");if(!e||!n){const o=[".country-selector","[data-language-selector]",'form[action*="language"]','form[action*="lang"]'];for(const t of o){const o=document.querySelector(t);if(o){if("FORM"===o.tagName)n=o;else{const e=o.closest("form");e&&(n=e)}if(e=o.querySelector("[data-value]")||document.querySelector("[data-value]"),n&&e)break}}}return{languageItem:e,languageForm:n}}function c(e,n){if(!e?.getAttribute||!n?.querySelector)return r("Could not find UI elements required for language selection."),!1;try{const o=n.querySelector('input[name="language"]');if(!o)throw new Error("Language input field not found.");return e.getAttribute("data-value")===a.language?(r("Language is already set to Japanese."),!1):(o.value=a.language,a.showNotification&&g("Changing language to Japanese..."),n.submit(),!0)}catch(e){return function(e,n){console.error(`[NicoNico Language] ${n}:`,e),a.showNotification&&g(`Error: ${n}`,5e3,"error")}(e,"Error occurred while changing language settings"),!1}}function g(e,n=3e3,o="success"){if(!a.showNotification)return;const t=document.createElement("div");t.textContent=e,t.style.cssText=`\n            position: fixed;\n            top: 10px;\n            right: 10px;\n            background: ${"error"===o?"#f44336":"#4CAF50"};\n            color: white;\n            padding: 10px;\n            border-radius: 5px;\n            z-index: 9999;\n            font-family: Arial, sans-serif;\n            box-shadow: 0 2px 5px rgba(0,0,0,0.2);\n        `,document.body.appendChild(t),setTimeout((()=>{t.style.opacity="0",t.style.transition="opacity 0.5s",setTimeout((()=>t.remove()),500)}),n)}function l(){if(!a.enabled)return void r("Script is disabled.");if(document.documentElement.lang===a.language&&(r("Language is already set to Japanese. Exiting script."),1))return;const e=u();e.languageItem&&e.languageForm?c(e.languageItem,e.languageForm):(r("Language selection elements not found. Starting DOM change detection."),function(){if(window._nicoLangObserver)return;const e=new MutationObserver((e=>{window._nicoLangCheckTimeout||(window._nicoLangCheckTimeout=setTimeout((()=>{const e=u();e.languageItem&&e.languageForm&&c(e.languageItem,e.languageForm)&&d(),window._nicoLangCheckTimeout=null}),100))}));e.observe(document.documentElement,{childList:!0,subtree:!0,attributes:!1,characterData:!1}),window._nicoLangObserver=e,window._nicoLangTimeout=setTimeout((()=>{d(),r("Language elements not found. Observation timed out.")}),5e3)}())}function d(){window._nicoLangCheckTimeout&&(clearTimeout(window._nicoLangCheckTimeout),window._nicoLangCheckTimeout=null),window._nicoLangObserver&&(window._nicoLangObserver.disconnect(),window._nicoLangObserver=null),window._nicoLangTimeout&&(clearTimeout(window._nicoLangTimeout),window._nicoLangTimeout=null)}window.addEventListener("unload",(function e(){d(),window._nicoLangCheckTimeout&&(clearTimeout(window._nicoLangCheckTimeout),delete window._nicoLangCheckTimeout),window.removeEventListener("unload",e),delete window._nicoLangObserver,delete window._nicoLangTimeout})),"loading"===document.readyState?document.addEventListener("DOMContentLoaded",l):l(),"function"==typeof GM_registerMenuCommand&&GM_registerMenuCommand("Toggle Script",(()=>{a.enabled=!a.enabled,GM_setValue("settings",a),g(`Script has been ${a.enabled?"enabled":"disabled"}.`),a.enabled&&l()}))}();