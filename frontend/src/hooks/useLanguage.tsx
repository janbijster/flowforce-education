import { useTranslation } from "react-i18next";

export function useLanguage() {
    const { i18n } = useTranslation();
    
    return {
        language: i18n.language,
        setLanguage: (language: string) => {
            i18n.changeLanguage(language);
        },
    };
}

