import { useTranslation } from "react-i18next";
import { appConfig } from "@/config/app";
import { ModeToggle } from "../mode-toggle";
import { LanguageToggle } from "../language-toggle";

export function Footer() {
    const { t } = useTranslation();
    return (
        <footer className="flex flex-col items-center justify-between gap-4 min-h-[3rem] md:h-20 py-2 md:flex-row">
            <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">{t("footer.demoEnvironment")}</p>
            <div className="hidden md:flex items-center gap-2">
                <LanguageToggle />
                <ModeToggle />
            </div>
        </footer>
    )
}