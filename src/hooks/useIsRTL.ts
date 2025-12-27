import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";

/**
 * Hook to detect if the current language is RTL (Right-to-Left)
 * Returns true for Arabic and other RTL languages
 */
export const useIsRTL = (): boolean => {
  const { i18n } = useTranslation();
  const [isRTL, setIsRTL] = useState(false);

  useEffect(() => {
    const checkRTL = () => {
      const lng = i18n.language?.toLowerCase() || "";
      const rtl = lng.startsWith("ar") || ["he", "fa", "ur"].includes(lng);
      setIsRTL(rtl);
    };

    checkRTL();
    
    // Listen for language changes
    i18n.on("languageChanged", checkRTL);
    
    return () => {
      i18n.off("languageChanged", checkRTL);
    };
  }, [i18n]);

  return isRTL;
};

