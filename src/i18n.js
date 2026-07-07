// Minimal AR/EN UI localization. The physics and scenario data are untouched;
// this only swaps on-screen strings and text direction.
//
// Static HTML: tag elements with data-i18n="key" (textContent is replaced) and
// data-i18n-dir (dir attribute follows the language). Dynamic strings (status
// line, scenario buttons) call t() / getLang() and re-render via onLangChange.

const STRINGS = {
  en: {
    'app.title': 'Football Motion Simulation',
    'ui.power': 'power',
    'ui.elevation': 'elevation°',
    'ui.follow': 'Follow ball',
    'ui.hint': 'Click to shoot',
    'help.orbit': 'orbit',
    'help.pan': 'pan',
    'help.zoom': 'zoom',
    'help.click': 'click',
    'help.or': 'or',
    'help.space': 'Space',
    'help.shoot': 'shoot',
    'help.reset': 'reset',
    'help.drag': 'drag',
    'help.scroll': 'scroll',
    'help.mouse': 'mouse',
    'scen.title': 'Validation scenarios',
    'scen.free': 'Free mode (stop scenario)',
    'scen.export': 'Export run data (CSV)',
    'scen.pick': 'Pick a scenario to run and record',
    'scen.recording': '⏺ recording… {t} s',
    'scen.ready': '✓ {id}: {n} steps ready to export',
    'lang.switch': 'عربي',
  },
  ar: {
    'app.title': 'محاكاة حركة كرة القدم',
    'ui.power': 'القوة',
    'ui.elevation': 'زاوية الإطلاق°',
    'ui.follow': 'تتبّع الكرة',
    'ui.hint': 'انقر للتسديد',
    'help.orbit': 'مدار',
    'help.pan': 'تحريك',
    'help.zoom': 'تقريب',
    'help.click': 'نقرة',
    'help.or': 'أو',
    'help.space': 'مسافة',
    'help.shoot': 'تسديد',
    'help.reset': 'إعادة ضبط',
    'help.drag': 'سحب',
    'help.scroll': 'تمرير',
    'help.mouse': 'بالفأرة',
    'scen.title': 'سيناريوهات التحقق',
    'scen.free': 'وضع حر (إيقاف السيناريو)',
    'scen.export': 'تصدير بيانات التشغيل CSV',
    'scen.pick': 'اختر سيناريو للتشغيل والتسجيل',
    'scen.recording': '⏺ تسجيل… {t} ث',
    'scen.ready': '✓ {id}: {n} خطوة جاهزة للتصدير',
    'lang.switch': 'English',
  },
};

let lang = localStorage.getItem('lang') === 'en' ? 'en' : 'ar';
const listeners = [];

export function getLang() {
  return lang;
}

// t('scen.ready', { id: 's1', n: 293 }) — {placeholders} come from params.
export function t(key, params = {}) {
  let text = STRINGS[lang][key] ?? STRINGS.en[key] ?? key;
  for (const [name, value] of Object.entries(params)) {
    text = text.replace(`{${name}}`, value);
  }
  return text;
}

export function onLangChange(fn) {
  listeners.push(fn);
}

function apply() {
  document.documentElement.lang = lang;
  document.title = t('app.title');
  for (const el of document.querySelectorAll('[data-i18n]')) {
    el.textContent = t(el.dataset.i18n);
  }
  for (const el of document.querySelectorAll('[data-i18n-dir]')) {
    el.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
  }
  for (const fn of listeners) fn(lang);
}

export function setLang(next) {
  lang = next;
  localStorage.setItem('lang', next);
  apply();
}

// Wires the toggle button and applies the persisted language to the page.
export function setupI18n() {
  document.getElementById('lang-toggle').addEventListener('click', () => {
    setLang(lang === 'ar' ? 'en' : 'ar');
  });
  apply();
}
