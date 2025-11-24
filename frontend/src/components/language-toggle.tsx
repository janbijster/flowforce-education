import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { useLanguage } from "@/hooks/useLanguage"

export function LanguageToggle() {
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguage()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="w-12 px-2">
          <span className="text-sm font-medium">{language.toUpperCase()}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem 
          className="cursor-pointer" 
          onClick={() => setLanguage("en")}
        >
          {t("language.english")}
        </DropdownMenuItem>
        <DropdownMenuItem 
          className="cursor-pointer" 
          onClick={() => setLanguage("nl")}
        >
          {t("language.nederlands")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

