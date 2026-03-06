/**
 * i18n.js
 * Handles English/Urdu translation across the HomePro application
 * Powered by Google Translate API
 */

// 1. Inject the Google Translate initialization script into the head
(function injectGoogleTranslate() {
    // Only inject once
    if (document.getElementById('google-translate-script')) return;

    // Create the required google_translate_element div (we'll hide this later)
    const gtContainer = document.createElement('div');
    gtContainer.id = 'google_translate_element';
    gtContainer.style.display = 'none'; // Hide the ugly default widget
    document.body.appendChild(gtContainer);

    // Initialize function called by Google's script
    window.googleTranslateElementInit = function () {
        new google.translate.TranslateElement({
            pageLanguage: 'en',
            includedLanguages: 'en,ur', // Only allow English and Urdu
            layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
            autoDisplay: false
        }, 'google_translate_element');
    };

    // Load the actual Google Translate script
    const script = document.createElement('script');
    script.id = 'google-translate-script';
    script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    script.async = true;
    document.head.appendChild(script);
})();

// 2. Custom Translation Trigger Logic
function changeLanguage(targetLang) {
    // Google translate uses a select dropdown internally
    const selectElement = document.querySelector('.goog-te-combo');
    if (selectElement) {
        selectElement.value = targetLang;
        // Trigger the change event so Google recognizes it
        selectElement.dispatchEvent(new Event('change'));

        // Toggle font & direction class
        if (targetLang === 'ur') {
            document.body.classList.add('lang-ur');
            document.documentElement.lang = 'ur';
            document.documentElement.dir = 'rtl';
        } else {
            document.body.classList.remove('lang-ur');
            document.documentElement.lang = 'en';
            document.documentElement.dir = 'ltr';
        }

        // Save preference
        localStorage.setItem('homepro_lang', targetLang);
        updateToggleButton(targetLang);
    } else {
        // If the script hasn't fully loaded yet, wait and retry
        setTimeout(() => changeLanguage(targetLang), 500);
    }
}

// 3. UI Toggle Button Logic
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

// 4. Inject Custom UI and Restore Preference on Load
window.addEventListener('DOMContentLoaded', () => {
    // Insert a custom style to hide the intrusive Google Translate top banner
    const style = document.createElement('style');
    style.innerHTML = `
        @import url('https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;700&display=swap');
        
        /* Hide the top banner */
        .goog-te-banner-frame { display: none !important; }
        /* Prevent body shift caused by the top banner */
        body { top: 0px !important; }
        /* Hide the "Powered by Google Translate" tooltip */
        .goog-tooltip { display: none !important; }
        .goog-tooltip:hover { display: none !important; }
        /* Hide the original element */
        .goog-te-gadget { display: none !important; }
        /* Fix hovering text styling issues */
        .goog-text-highlight { background-color: transparent !important; box-shadow: none !important; }
        
        /* Global Urdu Font Support */
        body.lang-ur, body.lang-ur * {
            font-family: 'Noto Nastaliq Urdu', 'Times New Roman', serif !important;
            letter-spacing: normal !important;
        }
    `;
    document.head.appendChild(style);

    // Build the language toggle button UI
    const toggleBtn = document.createElement('button');
    toggleBtn.id = 'i18n-toggle-btn';
    // Use flex-shrink-0 and normal margins instead of auto pushing
    toggleBtn.className = 'flex-shrink-0 flex items-center justify-center px-4 py-1.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 transition-colors shadow-sm cursor-pointer z-50 text-nowrap ml-2';
    toggleBtn.onclick = handleLanguageToggle;
    toggleBtn.title = "Switch Language (English / Urdu)";

    // Inject the button into the header
    const headerNav = document.querySelector('header nav') || document.querySelector('header > div:last-child > div:last-child') || document.querySelector('header');

    if (headerNav) {
        // Append it as the last element of the nav container (so it goes after the logout button)
        headerNav.appendChild(toggleBtn);
        // Add a bit of gap if the parent doesn't have it
        if (!headerNav.className.includes('gap-')) {
            headerNav.style.gap = '16px';
        }
    }

    // Try to restore user preference
    const savedLang = localStorage.getItem('homepro_lang');
    if (savedLang === 'ur') {
        document.body.classList.add('lang-ur');
        document.documentElement.lang = 'ur';
        document.documentElement.dir = 'rtl';
        // Need a slight delay to ensure Google's script loaded the dropdown before we try to change it
        setTimeout(() => changeLanguage('ur'), 1000);
    } else {
        updateToggleButton('en');
    }
});
