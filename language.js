/**
 * SMART OPD - LANGUAGE & INTERNATIONALIZATION ENGINE
 */
window.SmartOPD = window.SmartOPD || {};

SmartOPD.Language = {
  currentLang: 'en',

  init() {
    // Restore language preference from localStorage or default to 'en'
    const saved = localStorage.getItem('smart_opd_lang');
    if (saved && ['en', 'hi', 'gu'].includes(saved)) {
      this.currentLang = saved;
    } else {
      this.currentLang = 'en';
    }

    this.applyLanguage();
  },

  setLanguage(lang) {
    if (!['en', 'hi', 'gu'].includes(lang)) return;
    this.currentLang = lang;
    localStorage.setItem('smart_opd_lang', lang);
    this.applyLanguage();
    
    // Broadcast event for active components
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
  },

  getLanguage() {
    return this.currentLang;
  },

  /**
   * Main Translation function t(key, params)
   */
  t(key, params = {}) {
    const dict = SmartOPD.Translations[this.currentLang] || SmartOPD.Translations['en'];
    let text = dict[key] || SmartOPD.Translations['en'][key] || key;

    // Parameter interpolation like {count}
    Object.keys(params).forEach(p => {
      text = text.replace(new RegExp(`\\{${p}\\}`, 'g'), params[p]);
    });

    return text;
  },

  /**
   * Update all DOM elements with data-i18n attributes
   */
  applyLanguage() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (key) {
        el.textContent = this.t(key);
      }
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (key) {
        el.setAttribute('placeholder', this.t(key));
      }
    });

    // Update select element value if present
    const langSelect = document.getElementById('global-lang-select');
    if (langSelect) {
      langSelect.value = this.currentLang;
    }
  }
};
