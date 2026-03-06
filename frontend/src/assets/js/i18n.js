/**
 * i18n.js
 * Handles English/Urdu translation across the HomePro application
 * Powered by Lingvanex REST API
 */

const LINGVANEX_API_KEY = 'a_0Lx6FV7k2u85kOG915oCQPTfxI4Y9n0cpSp3KGiEpQZmosbicvo144mHWK36MWSz0LpPebEwI7iFsBGC';
const LINGVANEX_URL = 'https://api-b2b.backenster.com/b1/api/v3/translate';

// Local cache to prevent re-translating strings we already know
// Stored in session memory to keep it fast, or could be localStorage for persistence
let translationCache = JSON.parse(localStorage.getItem('homepro_translation_cache') || '{}');

function saveCache() {
    try {
        localStorage.setItem('homepro_translation_cache', JSON.stringify(translationCache));
    } catch (e) { /* Ignore quota exceeded */ }
}

// 1. Text Node Crawler
function getTranslatableNodes(element) {
    const nodes = [];
    const walker = document.createTreeWalker(
        element,
        NodeFilter.SHOW_TEXT,
        {
            acceptNode: function (node) {
                // Skip empty whitespace
                if (!node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;

                // Skip script, style, noscript tags
                const parentTag = node.parentElement ? node.parentElement.tagName.toLowerCase() : '';
                if (['script', 'style', 'noscript', 'code'].includes(parentTag)) {
                    return NodeFilter.FILTER_REJECT;
                }

                // Skip elements that explicitly shouldn't be translated (e.g. material icons)
                if (node.parentElement && node.parentElement.classList.contains('material-symbols-outlined')) {
                    return NodeFilter.FILTER_REJECT;
                }

                // Support ignoring marked elements
                if (node.parentElement && node.parentElement.hasAttribute('data-no-translate')) {
                    return NodeFilter.FILTER_REJECT;
                }

                return NodeFilter.FILTER_ACCEPT;
            }
        }
    );

    let currentNode;
    while (currentNode = walker.nextNode()) {
        nodes.push(currentNode);
    }
    return nodes;
}

// 2. Lingvanex Translation Engine
async function translateNodesToUrdu(nodes) {
    const textsToTranslate = [];
    const nodeMap = [];

    // Filter out already cached texts
    for (let node of nodes) {
        // Store the original english text on the node object itself so we can always revert
        if (!node._originalEnglish) {
            node._originalEnglish = node.nodeValue;
        }

        const text = node._originalEnglish.trim();

        // If it's just numbers or symbols, or we already have it cached
        if (translationCache[text]) {
            node.nodeValue = node.nodeValue.replace(text, translationCache[text]);
        } else if (text.match(/[a-zA-Z]/)) {
            // Needs translation through API
            textsToTranslate.push(text);
            nodeMap.push({ node, original: text });
        }
    }

    if (textsToTranslate.length === 0) return;

    // Lingvanex API request
    try {
        // We might need to chunk this if the array gets too massive (e.g. > 100 items), 
        // but for a standard UI page it should be fine.
        const response = await fetch(LINGVANEX_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${LINGVANEX_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                to: 'ur',
                from: 'en',
                data: textsToTranslate
            })
        });

        const result = await response.json();

        if (result && result.result) {
            // Map translations back directly to the exact DOM nodes
            nodeMap.forEach((mapping, index) => {
                const translatedText = result.result[index];
                if (translatedText) {
                    mapping.node.nodeValue = mapping.node.nodeValue.replace(mapping.original, translatedText);
                    // Save to cache
                    translationCache[mapping.original] = translatedText;
                }
            });
            saveCache();
        }
    } catch (error) {
        console.error("Translation API Error:", error);
    }
}

function restoreEnglish(nodes) {
    for (let node of nodes) {
        if (node._originalEnglish) {
            node.nodeValue = node._originalEnglish;
        }
    }
}

// 3. Main Toggle Logic
async function changeLanguage(targetLang) {
    const isUrdu = targetLang === 'ur';

    // Toggle font & direction class
    if (isUrdu) {
        document.body.classList.add('lang-ur');
        document.documentElement.lang = 'ur';
        document.documentElement.dir = 'rtl';
    } else {
        document.body.classList.remove('lang-ur');
        document.documentElement.lang = 'en';
        document.documentElement.dir = 'ltr';
    }

    const toggleBtn = document.getElementById('i18n-toggle-btn');
    if (toggleBtn) {
        // Show loading state
        toggleBtn.style.opacity = '0.5';
        toggleBtn.style.pointerEvents = 'none';
    }

    const textNodes = getTranslatableNodes(document.body);

    if (isUrdu) {
        await translateNodesToUrdu(textNodes);
    } else {
        restoreEnglish(textNodes);
    }

    // Save preference
    localStorage.setItem('homepro_lang', targetLang);
    updateToggleButton(targetLang);

    if (toggleBtn) {
        toggleBtn.style.opacity = '1';
        toggleBtn.style.pointerEvents = 'auto';
    }
}

// 4. UI Toggle Button Logic
function updateToggleButton(lang) {
    const isUrdu = lang === 'ur';
    const toggleBtn = document.getElementById('i18n-toggle-btn');
    if (!toggleBtn) return;

    if (isUrdu) {
        toggleBtn.innerHTML = '<span class="text-xs font-bold text-slate-400">EN</span><span class="mx-1 text-slate-300">/</span><span class="text-sm font-bold text-primary">UR</span>';
    } else {
        toggleBtn.innerHTML = '<span class="text-sm font-bold text-primary">EN</span><span class="mx-1 text-slate-300">/</span><span class="text-xs font-bold text-slate-400">UR</span>';
    }
}

function handleLanguageToggle() {
    const currentLang = localStorage.getItem('homepro_lang') || 'en';
    const newLang = currentLang === 'en' ? 'ur' : 'en';
    changeLanguage(newLang);
}

// 5. Inject Custom UI and Restore Preference on Load
window.addEventListener('DOMContentLoaded', () => {
    // Only apply the translation engine to worker-facing pages
    if (!window.location.pathname.includes('/worker/')) {
        // If we are on a non-worker page, explicitly ensure LTR and English
        document.body.classList.remove('lang-ur');
        document.documentElement.lang = 'en';
        document.documentElement.dir = 'ltr';
        return;
    }

    // Insert a custom style for the Urdu font
    const style = document.createElement('style');
    style.innerHTML = `
        @import url('https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;700&display=swap');
        
        /* Global Urdu Font Support */
        body.lang-ur, body.lang-ur * {
            font-family: 'Noto Nastaliq Urdu', 'Times New Roman', serif !important;
            letter-spacing: normal !important;
        }

        /* Protect Material Icons from Nastaliq font scaling and RTL mirroring issues */
        body.lang-ur .material-symbols-outlined {
            font-family: 'Material Symbols Outlined' !important;
            direction: ltr !important;
            display: inline-block;
        }
    `;
    document.head.appendChild(style);

    // Build the language toggle button UI
    const toggleBtn = document.createElement('button');
    toggleBtn.id = 'i18n-toggle-btn';
    toggleBtn.className = 'flex-shrink-0 flex items-center justify-center px-4 py-1.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 transition-colors shadow-sm cursor-pointer z-50 text-nowrap ml-2';
    // Add data-no-translate so the button itself is ignored by the crawler
    toggleBtn.setAttribute('data-no-translate', 'true');
    toggleBtn.onclick = handleLanguageToggle;
    toggleBtn.title = "Switch Language (English / Urdu)";

    // Inject the button into the header
    const headerNav = document.querySelector('header nav') || document.querySelector('header > div:last-child > div:last-child') || document.querySelector('header');

    if (headerNav) {
        // Append it as the last element of the nav container
        headerNav.appendChild(toggleBtn);
        // Add a bit of gap if the parent doesn't have it
        if (!headerNav.className.includes('gap-')) {
            headerNav.style.gap = '16px';
        }
    }

    // Initialize state
    const savedLang = localStorage.getItem('homepro_lang');
    if (savedLang === 'ur') {
        updateToggleButton('ur'); // Update button UI immediately
        changeLanguage('ur');
    } else {
        updateToggleButton('en');
    }
});
