import i18n from "i18next";


// 切换语言
export const changeLang = (lang: string) => {
  localStorage.setItem("lang", lang)
  i18n.changeLanguage(lang) // 切换语言
}

// 获取语言
export function getBrowserLang(): string {
  let lang
  if (localStorage.getItem("lang")) {
    lang = localStorage.getItem("lang")
  } else {
    lang = navigator.language.toLowerCase()
  }
  let to = lang?.toString()

  return to ? to: "en"
}