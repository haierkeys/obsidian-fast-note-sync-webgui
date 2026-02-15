import { initReactI18next } from "react-i18next";
import { getBrowserLang } from "@/i18n/utils";
import i18n from "i18next";


const locales = import.meta.glob('./locales/*.ts');

const loadResources = async (lang: string) => {
  const path = `./locales/${lang}.ts`;
  if (locales[path]) {
    try {
      const module: any = await locales[path]();
      return module.default;
    } catch (error) {
      console.error(`Failed to load locale: ${lang}`, error);
    }
  }
  const fallback: any = await locales['./locales/zh-CN.ts']();
  return fallback.default;
};

i18n.use(initReactI18next).init({
  resources: {},
  lng: getBrowserLang(),
  fallbackLng: "zh-CN",
  interpolation: { escapeValue: false },
});

const initialLang = getBrowserLang();
loadResources(initialLang).then(resource => {
  i18n.addResourceBundle(initialLang, 'translation', resource, true, true);
});

i18n.on('languageChanged', async (lang) => {
  if (!i18n.hasResourceBundle(lang, 'translation')) {
    const resource = await loadResources(lang);
    i18n.addResourceBundle(lang, 'translation', resource, true, true);
  }
});

export default i18n;
