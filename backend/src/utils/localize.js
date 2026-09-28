const SUPPORTED_LANGS = ['en', 'hi'];
const DEFAULT_LANG = 'en';

function resolveLang(req) {
  const fromQuery = String(req.query.lang || '').toLowerCase();
  if (SUPPORTED_LANGS.includes(fromQuery)) return fromQuery;
  const header = String(req.headers['accept-language'] || '').toLowerCase();
  const fromHeader = SUPPORTED_LANGS.find((lang) => header.startsWith(lang));
  return fromHeader || DEFAULT_LANG;
}

function t(value, lang) {
  if (value == null) return value;
  if (typeof value === 'string') return value;
  return value[lang] || value[DEFAULT_LANG] || '';
}

module.exports = { SUPPORTED_LANGS, DEFAULT_LANG, resolveLang, t };
