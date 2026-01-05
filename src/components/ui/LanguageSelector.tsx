import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const languages: Array<{ code: string; label: string }> = [
  { code: "en", label: "English" },
  { code: "ar", label: "العربية" }
];

export function LanguageSelector() {
  const { i18n, t } = useTranslation();

  const current =
    languages.find((l) => l.code.toLowerCase() === (i18n.language || "en").toLowerCase())?.label ||
    "English";

  const changeLanguage = async (lng: string) => {
    await i18n.changeLanguage(lng);
    try {
      localStorage.setItem("i18nextLng", lng);
    } catch {}
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-9 px-2 text-sm">
          {current}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{t("Language")}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {languages.map((lng) => (
          <DropdownMenuItem key={lng.code} onClick={() => changeLanguage(lng.code)}>
            {lng.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default LanguageSelector;


