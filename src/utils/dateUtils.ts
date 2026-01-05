// Import i18n instance from the project's i18n configuration
import i18n from "@/i18n";

/**
 * Get the locale based on current language
 */
export const getLocale = (): string => {
  const currentLanguage = i18n.language || "en";
  // Map language codes to locale codes
  const localeMap: Record<string, string> = {
    ar: "ar-SA",
    "ar-SA": "ar-SA",
    "ar-EG": "ar-EG",
    "ar-OM": "ar-OM",
    en: "en-US",
    "en-US": "en-US",
    "en-ZA": "en-ZA",
    "en-NZ": "en-NZ",
    hi: "hi-IN",
    fr: "fr-FR",
    es: "es-ES",
    ha: "ha-NG",
  };
  return localeMap[currentLanguage] || "en-US";
};

/**
 * Format date based on current language
 */
export const formatDate = (
  dateString: string | Date | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string => {
  if (!dateString) return "-";
  
  try {
    const date = typeof dateString === "string" ? new Date(dateString) : dateString;
    
    if (isNaN(date.getTime())) {
      return "-";
    }
    
    const locale = getLocale();
    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    
    return date.toLocaleDateString(locale, { ...defaultOptions, ...options });
  } catch (error) {
    console.error("Error formatting date:", error);
    return "-";
  }
};

/**
 * Format date with short month name
 */
export const formatDateShort = (
  dateString: string | Date | null | undefined
): string => {
  return formatDate(dateString, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

/**
 * Format date with weekday
 */
export const formatDateWithWeekday = (
  dateString: string | Date | null | undefined
): string => {
  return formatDate(dateString, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

/**
 * Format date short with weekday
 */
export const formatDateShortWithWeekday = (
  dateString: string | Date | null | undefined
): string => {
  return formatDate(dateString, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
};

/**
 * Format time based on current language
 */
export const formatTime = (
  dateString: string | Date | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string => {
  if (!dateString) return "-";
  
  try {
    const date = typeof dateString === "string" ? new Date(dateString) : dateString;
    
    if (isNaN(date.getTime())) {
      return "-";
    }
    
    const locale = getLocale();
    const defaultOptions: Intl.DateTimeFormatOptions = {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    };
    
    return date.toLocaleTimeString(locale, { ...defaultOptions, ...options });
  } catch (error) {
    console.error("Error formatting time:", error);
    return "-";
  }
};

/**
 * Format date and time together
 */
export const formatDateTime = (
  dateString: string | Date | null | undefined
): string => {
  if (!dateString) return "-";
  
  try {
    const date = typeof dateString === "string" ? new Date(dateString) : dateString;
    
    if (isNaN(date.getTime())) {
      return "-";
    }
    
    const locale = getLocale();
    return date.toLocaleString(locale, {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch (error) {
    console.error("Error formatting date time:", error);
    return "-";
  }
};

