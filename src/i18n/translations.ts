import { initReactI18next } from "react-i18next";
import { getBrowserLang } from "@/i18n/utils";
import i18n from "i18next";

import zhTW from "./locales/zh-TW";
import zhCN from "./locales/zh-CN";
import ptBR from "./locales/pt-BR";
import vi from "./locales/vi";
import uk from "./locales/uk";
import tr from "./locales/tr";
import th from "./locales/th";
import ru from "./locales/ru";
import pt from "./locales/pt";
import pl from "./locales/pl";
import nl from "./locales/nl";
import ko from "./locales/ko";
import ja from "./locales/ja";
import it from "./locales/it";
import id from "./locales/id";
import fr from "./locales/fr";
import es from "./locales/es";
import en from "./locales/en";
import de from "./locales/de";
import ar from "./locales/ar";


i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    "zh-CN": { translation: zhCN },
    ja: { translation: ja },
    ko: { translation: ko },
    "zh-TW": { translation: zhTW },
    id: { translation: id },
    th: { translation: th },
    vi: { translation: vi },
    tr: { translation: tr },
    fr: { translation: fr },
    de: { translation: de },
    es: { translation: es },
    it: { translation: it },
    pt: { translation: pt },
    "pt-BR": { translation: ptBR },
    nl: { translation: nl },
    pl: { translation: pl },
    uk: { translation: uk },
    ru: { translation: ru },
    ar: { translation: ar },
  },
  lng: getBrowserLang(),
  fallbackLng: "zh-CN",
  interpolation: {
    escapeValue: false, // react 已经安全地处理了 HTML 转义
  },
})

export default i18n
