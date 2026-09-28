import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { strings } from './strings';
import { setApiLanguage } from '../api';

const I18nContext = createContext(null);

const interpolate = (template, vars) =>
  template.replace(/\{(\w+)\}/g, (_, key) => (vars[key] !== undefined ? String(vars[key]) : `{${key}}`));

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState('en');

  const setLang = useCallback((next) => {
    setApiLanguage(next);
    setLangState(next);
  }, []);

  const t = useCallback(
    (key, vars = {}) => interpolate(strings[lang][key] ?? strings.en[key] ?? key, vars),
    [lang],
  );

  const ordinalWinner = useCallback(
    (n) => t('winner', { ordinal: strings[lang][`ordinal.${n}`] ?? t('ordinal.n', { n }) }),
    [lang, t],
  );

  const value = useMemo(() => ({ lang, setLang, t, ordinalWinner }), [lang, setLang, t, ordinalWinner]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside I18nProvider');
  return ctx;
}

export function useErrorMessage() {
  const { t } = useI18n();
  return useCallback(
    (err) => {
      const key = `error.${err?.code}`;
      const translated = t(key);
      return translated !== key ? translated : err?.message || t('somethingWrong');
    },
    [t],
  );
}
