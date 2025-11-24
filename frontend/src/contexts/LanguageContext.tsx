import { useEffect } from "react"
import i18n from "../lib/i18n"

type LanguageProviderProps = {
    children: React.ReactNode
}

export function LanguageProvider({
    children,
    ...props
}: LanguageProviderProps) {
    useEffect(() => {
        // Set language attribute on html element
        const updateLang = () => {
            document.documentElement.setAttribute('lang', i18n.language)
        }
        
        updateLang()
        i18n.on('languageChanged', updateLang)
        
        return () => {
            i18n.off('languageChanged', updateLang)
        }
    }, [])

    return <>{children}</>
}

