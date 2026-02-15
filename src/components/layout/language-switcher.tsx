import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { changeLang } from "@/i18n/utils";
import { Languages } from "lucide-react";


interface LanguageSwitcherProps {
    className?: string;
    showText?: boolean;
}

export function LanguageSwitcher({ className, showText = false }: LanguageSwitcherProps) {
    const { t } = useTranslation();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size={showText ? "default" : "icon"} className={className}>
                    <Languages className={showText ? "mr-2 h-4 w-4" : "h-5 w-5"} />
                    {showText && t("switchLanguage")}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="max-h-[300px] overflow-y-auto">
                <DropdownMenuItem onClick={() => changeLang("en")}>🇺🇸 English</DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeLang("zh-CN")}>🇨🇳 简体中文</DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeLang("zh-TW")}>🇭🇰 繁體中文</DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeLang("ja")}>🇯🇵 日本語</DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeLang("ko")}>🇰🇷 한국어</DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeLang("fr")}>🇫🇷 Français</DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeLang("de")}>🇩🇪 Deutsch</DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeLang("es")}>🇪🇸 Español</DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeLang("it")}>🇮🇹 Italiano</DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeLang("pt")}>🇵🇹 Português</DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeLang("pt-BR")}>🇧🇷 Português (Brasil)</DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeLang("ru")}>🇷🇺 Русский</DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeLang("uk")}>🇺🇦 Українська</DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeLang("be")}>🇧🇾 Беларуская</DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeLang("nl")}>🇳🇱 Nederlands</DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeLang("pl")}>🇵🇱 Polski</DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeLang("da")}>🇩🇰 Dansk</DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeLang("no")}>🇳🇴 Norsk</DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeLang("tr")}>🇹🇷 Türkçe</DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeLang("vi")}>🇻🇳 Tiếng Việt</DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeLang("th")}>🇹🇭 ไทย</DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeLang("hi")}>🇮🇳 हिन्दी</DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeLang("id")}>🇮🇩 Indonesia</DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeLang("ms")}>🇲🇾 Bahasa Melayu</DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeLang("ro")}>🇷🇴 Română</DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeLang("ca")}>🌐 Català</DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeLang("hu")}>🇭🇺 Magyar</DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeLang("ar")}>🇸🇦 العربية</DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeLang("he")}>🇮🇱 עברית</DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeLang("ne")}>🇳🇵 नेपाली</DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeLang("sq")}>🇦🇱 Shqip</DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
